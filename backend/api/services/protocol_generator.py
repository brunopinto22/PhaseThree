"""
Protocol Generation Service Module
==================================

This module provides automatic protocol document generation for placed
candidatures in the ISEC Internship and Project Partnerships Management System.

Protocols are legal documents that formalize the internship/project agreement
between ISEC, the student, and the company. They require signatures from:
1. ISEC (Presidency)
2. Company Representative
3. Student

Author: PhaseThree Team
"""

import os
import re
import logging
import tempfile
import unicodedata
from datetime import date
from typing import Optional, Dict, Any
from io import BytesIO

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone
from docxtpl import DocxTemplate
from docx2pdf import convert

from api.models import Candidature, Proposal, Student, Company, Teacher, Representative

logger = logging.getLogger(__name__)


class ProtocolGenerator:
    """
    Service for generating protocol documents for placed candidatures.
    
    Protocols are generated automatically when a candidature reaches 'placed' state
    and contain all necessary information for the internship/project agreement.
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.template_path = os.path.join(self.base_dir, "templates", "docs", "protocol_template.docx")
        self.protocol_upload_path = "protocols/"

    def generate_protocol(self, candidature: Candidature) -> Optional[str]:
        """
        Generate a protocol document for a placed candidature.
        
        Args:
            candidature: Candidature instance that has been placed
            
        Returns:
            Path to the saved protocol file, or None if generation failed
        """
        logger.info(f"Generating protocol for candidature {candidature.id_candidature}")
        
        try:
            # Validate candidature state
            if candidature.state != 'placed':
                logger.warning(
                    f"Candidature {candidature.id_candidature} is not in 'placed' state "
                    f"(current: {candidature.state})"
                )
                return None
            
            # Get the accepted proposal
            accepted_proposal = self._get_accepted_proposal(candidature)
            if not accepted_proposal:
                logger.error(f"No accepted proposal found for candidature {candidature.id_candidature}")
                return None
            
            # Build context for template
            context = self._build_context(candidature, accepted_proposal)
            
            # Generate document
            protocol_path = self._create_protocol_document(context, candidature, accepted_proposal)
            
            if protocol_path:
                # Update candidature state
                candidature.state = 'protocol_generated'
                candidature.save(update_fields=['state'])
                logger.info(f"Protocol generated successfully: {protocol_path}")
            
            return protocol_path
            
        except Exception as e:
            logger.exception(f"Error generating protocol for candidature {candidature.id_candidature}: {str(e)}")
            return None

    def _get_accepted_proposal(self, candidature: Candidature) -> Optional[Proposal]:
        """Get the accepted proposal from candidature."""
        try:
            candidature_proposal = candidature.candidature_proposals.filter(
                state='accepted'
            ).select_related('proposal').first()
            
            if candidature_proposal:
                return candidature_proposal.proposal
            return None
        except Exception as e:
            logger.error(f"Error getting accepted proposal: {str(e)}")
            return None

    def _build_context(self, candidature: Candidature, proposal: Proposal) -> Dict[str, Any]:
        """
        Build the context dictionary for the protocol template.
        
        This includes all information needed to populate the protocol document:
        - Student information
        - Company information
        - Proposal details
        - Advisors
        - Dates and academic information
        """
        student = candidature.student
        calendar = proposal.calendar
        
        # Format dates
        today = date.today()
        academic_year = f"{calendar.calendar_year}/{calendar.calendar_year + 1}"
        
        # Build company information
        company_info = None
        if proposal.company:
            company_info = {
                "name": proposal.company.company_name,
                "address": proposal.company.company_address,
                "postal_code": proposal.company.company_postal_code,
                "nipc": proposal.company.company_nipc,
                "email": proposal.company.company_email,
                "website": proposal.company.company_website or "",
            }
        
        # Build advisor information
        isec_advisor_info = None
        if proposal.isec_advisor:
            isec_advisor_info = {
                "name": proposal.isec_advisor.teacher_name,
                "email": proposal.isec_advisor.user.email,
                "category": proposal.isec_advisor.teacher_category,
            }
        
        company_advisor_info = None
        if proposal.company_advisor:
            company_advisor_info = {
                "name": proposal.company_advisor.representative_name,
                "email": proposal.company_advisor.user.email,
                "role": proposal.company_advisor.representative_role or "",
            }
        
        # Build branch information
        branches = [{"name": b.branch_name, "acronym": b.branch_acronym} for b in proposal.branches.all()]
        
        # Format work format
        work_format_map = {
            1: "Presencial",
            2: "Remoto",
            3: "Híbrido"
        }
        work_format = work_format_map.get(proposal.work_format, str(proposal.work_format))
        
        # Format proposal type
        proposal_type_map = {
            1: "Estágio",
            2: "Projeto"
        }
        proposal_type = proposal_type_map.get(proposal.proposal_type, str(proposal.proposal_type))
        
        context = {
            # Document metadata
            "protocol_number": f"PROT-{candidature.id_candidature:04d}",
            "generation_date": today.strftime("%d/%m/%Y"),
            "academic_year": academic_year,
            "semester": calendar.calendar_semester,
            
            # Student information
            "student": {
                "number": student.student_number,
                "name": student.student_name,
                "email": student.user.email,
                "nif": student.nif,
                "nationality": student.nationality or "",
                "ident_type": student.ident_type or "",
                "ident_doc": student.ident_doc or "",
                "address": student.address or "",
                "contact": student.contact or "",
                "gender": student.gender or "",
            },
            
            # Course information
            "course": {
                "name": proposal.course.course_name,
                "description": proposal.course.course_description or "",
            },
            "branches": branches,
            
            # Proposal information
            "proposal": {
                "title": proposal.proposal_title,
                "type": proposal_type,
                "description": proposal.proposal_description,
                "objectives": proposal.proposal_objectives or "",
                "technologies": proposal.proposal_technologies or "",
                "methodologies": proposal.proposal_methodologies or "",
                "location": proposal.location,
                "work_format": work_format,
                "schedule": proposal.schedule,
                "conditions": proposal.proposal_conditions or "",
                "scheduling": proposal.proposal_scheduling or "",
            },
            
            # Company information
            "company": company_info,
            
            # Advisors
            "isec_advisor": isec_advisor_info,
            "company_advisor": company_advisor_info,
            
            # Dates
            "start_date": calendar.submission_start.strftime("%d/%m/%Y"),
            "end_date": calendar.placements.strftime("%d/%m/%Y"),
            "candidature_date": candidature.candidature_submission_date.strftime("%d/%m/%Y"),
        }
        
        return context

    def _create_protocol_document(
        self,
        context: Dict[str, Any],
        candidature: Candidature,
        proposal: Proposal
    ) -> Optional[str]:
        """
        Create the protocol document using the template.
        
        Returns:
            Path to the saved protocol file, or None on failure
        """
        try:
            # Check if template exists
            if not os.path.exists(self.template_path):
                logger.error(f"Protocol template not found: {self.template_path}")
                # Create a placeholder template path note
                logger.warning("Protocol template needs to be created at: templates/docs/protocol_template.docx")
                return None
            
            # Load template
            doc = DocxTemplate(self.template_path)
            
            # Render template with context
            doc.render(context)
            
            # Create temporary DOCX file
            with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp_docx:
                doc.save(tmp_docx.name)
                tmp_docx_path = tmp_docx.name
            
            # Convert to PDF
            tmp_pdf_fd, tmp_pdf_path = tempfile.mkstemp(suffix=".pdf")
            os.close(tmp_pdf_fd)
            
            try:
                convert(tmp_docx_path, tmp_pdf_path)
            except Exception as e:
                logger.error(f"Error converting DOCX to PDF: {str(e)}")
                # Fallback: save as DOCX if PDF conversion fails
                with open(tmp_docx_path, "rb") as f:
                    docx_bytes = f.read()
                
                # Clean up temp files
                os.remove(tmp_docx_path)
                
                # Save DOCX instead
                filename = self._generate_filename(candidature, proposal, extension=".docx")
                file_path = default_storage.save(
                    os.path.join(self.protocol_upload_path, filename),
                    ContentFile(docx_bytes)
                )
                
                # Update candidature with protocol file path
                candidature.protocol_file = file_path
                candidature.save(update_fields=['protocol_file'])
                
                return file_path
            
            # Read PDF bytes
            with open(tmp_pdf_path, "rb") as f:
                pdf_bytes = f.read()
            
            # Clean up temp files
            os.remove(tmp_docx_path)
            os.remove(tmp_pdf_path)
            
            # Generate filename
            filename = self._generate_filename(candidature, proposal, extension=".pdf")
            
            # Save to storage
            file_path = default_storage.save(
                os.path.join(self.protocol_upload_path, filename),
                ContentFile(pdf_bytes)
            )
            
            # Update candidature with protocol file path
            candidature.protocol_file = file_path
            candidature.save(update_fields=['protocol_file'])
            
            return file_path
            
        except Exception as e:
            logger.exception(f"Error creating protocol document: {str(e)}")
            return None

    def _generate_filename(self, candidature: Candidature, proposal: Proposal, extension: str = ".pdf") -> str:
        """
        Generate a safe filename for the protocol document.
        
        Format: {year}-PROT-{candidature_id}-{student_number}-{proposal_title}.pdf
        """
        calendar = proposal.calendar
        student = candidature.student
        
        # Build base filename
        base_name = (
            f"{calendar.calendar_year}-"
            f"PROT-{candidature.id_candidature:04d}-"
            f"{student.student_number}-"
            f"{proposal.proposal_title}"
        )
        
        # Normalize and sanitize
        normalized = unicodedata.normalize('NFKD', base_name).encode('ASCII', 'ignore').decode('ASCII')
        safe_filename = re.sub(r'[\\/*?:"<>|]', "_", normalized)
        
        return safe_filename + extension

    def generate_protocols_batch(self, candidatures: list) -> Dict[str, Any]:
        """
        Generate protocols for multiple candidatures in batch.
        
        Args:
            candidatures: List of Candidature instances
            
        Returns:
            Dictionary with success/failure statistics
        """
        results = {
            "total": len(candidatures),
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }
        
        for candidature in candidatures:
            try:
                if candidature.state != 'placed':
                    results["skipped"] += 1
                    continue
                
                protocol_path = self.generate_protocol(candidature)
                
                if protocol_path:
                    results["successful"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append({
                        "candidature_id": candidature.id_candidature,
                        "error": "Protocol generation failed"
                    })
                    
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "candidature_id": candidature.id_candidature,
                    "error": str(e)
                })
                logger.error(f"Error in batch protocol generation for candidature {candidature.id_candidature}: {str(e)}")
        
        logger.info(f"Batch protocol generation completed: {results}")
        return results
