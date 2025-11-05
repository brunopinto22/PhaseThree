# Software Requirements Specification

**ISEC Internship and Project Partnerships Management System**

**Authors:**  
Bernardo Ventura, Bruno Pinto, Gonçalo Peleja, Gustavo Lima, João Lino, Lucas Carneiro, Miguel Brazão

---

## 1. Introduction

The purpose of this document is to define the requirements for the development of the ISEC Internship and Project Partnerships Management System.
The application is already partially developed, and the goal of this project is to complete and refine its functionalities, ensuring that it fully supports the management of internships, research projects, and institutional partnerships.

### 1.1 Purpose

The platform aims to centralize and streamline the management of partnerships between the Instituto Superior de Engenharia de Coimbra (ISEC) and external companies or organizations. It will support the complete lifecycle of partnership activities, including internship offers, research collaborations, student applications, project approvals, and monitoring of ongoing activities.

### 1.2 Product Scope

The System is a web-based application accessible to all stakeholders (students, teachers, companies, and administrative services).  
Its core objectives include:

- **Centralization:** Consolidate all partnership processes within a single digital platform.  
- **Automation:** Replace manual document handling and communication with automated workflows.  
- **Transparency:** Offer real-time access to application and partnership statuses.  
- **Auditability:** Maintain historical records of all changes for accountability.  

The system directly contributes to improving the efficiency and quality of internship and project management at ISEC.

### 1.3 Intended Audience

This document is intended for:

- **Development Team:** To guide the implementation of features and improvements.  
- **Project Supervisors / Advisors:** To review and validate the system requirements.  

--- 

## 2. System Features and Requirements

### 2.1 Features

The system provides functionalities that enable the management of partnerships and internships efficiently.
The main features of the system include:

- **User Management:**  
  The system supports the registration and management of different user types, including Teachers, Students, Companies, and company Representatives. Each user role has specific permissions and access to relevant functionalities.

- **Course and Commission Management:**  
  Administrators and coordinators can create and manage Courses within the platform, associating them with corresponding commissions responsible for overseeing internship and project activities.

- **Calendar Management:**  
  The platform allows the creation of Calendars containing key dates and milestones related to the internship and project process.  

- **Proposal Submission:**  
  Teachers and Companies can submit internship or project proposals directly through the platform.

- **Proposal Visualization:**  
  Students can access and view all available proposals associated with their course and the corresponding calendar.  

### 2.2 Functional Requirements

- **Student Applications:**  
  - Students can apply to a limited number of proposals within a predefined range.  
  - Application status is tracked throughout its lifecycle with timestamps.  
  - Students can upload their curriculum.
  
- **Orientation:**
  - Teachers and company Representatives can view the students they are supervising in internships or projects.  
  - The assignment (seriation) of student supervision should be automated but adjustable by authorized users.

- **Protocol Generation:**  
  - The system automatically generates protocol documents once applications are approved.  

- **Academic Services:**  
  - Staff can view all active internships and student placements.  
  - Validation and management of student registrations.  
  - Control over the progression of protocol and application statuses.  

- **Audit System:**  
  - Tracks all changes in applications and proposals with user and timestamp.  
  - Allows rollback of modifications if necessary.  

- **Notification System:**  
  - Email alerts for new calendars, applications, and approvals.  

- **Improvements** 
  - All forms are GDPR compliant.

### 2.3 Quality Attributes

---

## 3. Constraints

---

## 4. Prioritization

descrever o processo de prioriades que nos deram:
candidaturas dos alunos > seriacoes > protocolos || servicos academicos > sistema de auditoria