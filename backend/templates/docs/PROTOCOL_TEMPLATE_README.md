# Protocol Template Documentation

## REQ-7: Automatic Protocol Generation

This document describes the structure required for the protocol document template.

## Template Location

The protocol template should be placed at:
```
backend/templates/docs/protocol_template.docx
```

## Template Variables

The following variables are available in the template:

### Document Metadata
- `protocol_number` - Protocol number (format: PROT-0001)
- `generation_date` - Date when protocol was generated (format: DD/MM/YYYY)
- `academic_year` - Academic year (format: YYYY/YYYY+1)
- `semester` - Semester number (1 or 2)

### Student Information
- `student.number` - Student number
- `student.name` - Student full name
- `student.email` - Student email
- `student.nif` - Student NIF
- `student.nationality` - Student nationality
- `student.ident_type` - Identification document type
- `student.ident_doc` - Identification document number
- `student.address` - Student address
- `student.contact` - Student contact phone
- `student.gender` - Student gender

### Course Information
- `course.name` - Course name
- `course.description` - Course description
- `branches` - List of branches (array of objects with `name` and `acronym`)

### Proposal Information
- `proposal.title` - Proposal title
- `proposal.type` - Proposal type ("Estágio" or "Projeto")
- `proposal.description` - Proposal description
- `proposal.objectives` - Proposal objectives
- `proposal.technologies` - Technologies used
- `proposal.methodologies` - Methodologies
- `proposal.location` - Work location
- `proposal.work_format` - Work format ("Presencial", "Remoto", or "Híbrido")
- `proposal.schedule` - Work schedule
- `proposal.conditions` - Work conditions
- `proposal.scheduling` - Scheduling information

### Company Information (if applicable)
- `company.name` - Company name
- `company.address` - Company address
- `company.postal_code` - Company postal code
- `company.nipc` - Company NIPC
- `company.email` - Company email
- `company.website` - Company website

### Advisors
- `isec_advisor.name` - ISEC advisor name (if applicable)
- `isec_advisor.email` - ISEC advisor email
- `isec_advisor.category` - ISEC advisor category
- `company_advisor.name` - Company advisor name (if applicable)
- `company_advisor.email` - Company advisor email
- `company_advisor.role` - Company advisor role

### Dates
- `start_date` - Calendar submission start date
- `end_date` - Calendar placements date
- `candidature_date` - Candidature submission date

## Template Usage Example

In the DOCX template, use Jinja2-style syntax:

```
Protocolo Nº {{ protocol_number }}

Data de Geração: {{ generation_date }}
Ano Letivo: {{ academic_year }}
Semestre: {{ semester }}º Semestre

ALUNO
Nome: {{ student.name }}
Número: {{ student.number }}
Email: {{ student.email }}
NIF: {{ student.nif }}
...

CURSO
{{ course.name }}
{{ course.description }}

PROPOSTA
{{ proposal.title }}
Tipo: {{ proposal.type }}
...
```

## Notes

- All text fields are automatically escaped
- Empty fields will be replaced with empty strings
- The template should follow ISEC's official protocol document format
- The generated document will be converted to PDF automatically
- If PDF conversion fails, the DOCX file will be saved instead
