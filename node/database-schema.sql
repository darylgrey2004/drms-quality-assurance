-- DataBase para sa mga mag pull nito
-- DRMS-QA Database Schema
-- Database: drms_db

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `middleInitial` VARCHAR(10),
  `role` VARCHAR(100) DEFAULT 'Faculty Member',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `isVerified` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create faculty_profiles table
CREATE TABLE IF NOT EXISTS `faculty_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `dateOfBirth` DATE,
  `age` VARCHAR(10),
  `gender` VARCHAR(50),
  `civilStatus` VARCHAR(50),
  `nationality` VARCHAR(100),
  `phone` VARCHAR(50),
  `address` TEXT,
  `employeeId` VARCHAR(100),
  `position` VARCHAR(100),
  `department` VARCHAR(100),
  `employmentStatus` VARCHAR(100),
  `dateOfHire` DATE,
  `previousPositions` TEXT,
  `highestDegree` VARCHAR(100),
  `specialization` VARCHAR(200),
  `institution` VARCHAR(200),
  `gradYear` VARCHAR(10),
  `license` VARCHAR(200),
  `continuingEd` TEXT,
  `subjectsTaught` TEXT,
  `yearLevel` VARCHAR(100),
  `loadUnits` VARCHAR(50),
  `advising` VARCHAR(200),
  `committeeRoles` TEXT,
  `researchInterests` TEXT,
  `publications` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create otps table
CREATE TABLE IF NOT EXISTS `otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `otp` VARCHAR(6) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expiresAt` TIMESTAMP NOT NULL,
  INDEX idx_email (email),
  INDEX idx_otp (otp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create documents table (uploads + workflow)
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `department` VARCHAR(120) NOT NULL,
  `category` ENUM('ISO','COE','AACCUP') NOT NULL,
  `area` VARCHAR(120) NOT NULL,
  `version` VARCHAR(50) DEFAULT 'v1.0',
  `description` TEXT,
  `keywords` TEXT,
  `status` ENUM('submitted','validated_program_head','validated_coordinator','approved','locked','rejected') DEFAULT 'submitted',
  `workflow_status` ENUM('draft','pending','validated','approved','locked','rejected') DEFAULT 'pending',
  `is_locked` BOOLEAN DEFAULT FALSE,
  `date_added` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `approved_by` VARCHAR(120) NULL,
  `locked_at` TIMESTAMP NULL DEFAULT NULL,
  `pdf_file_path` VARCHAR(255) NULL,
  `uploader_id` INT NOT NULL,
  `author_name` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX idx_department (`department`),
  INDEX idx_category (`category`),
  INDEX idx_status (`workflow_status`),
  INDEX idx_uploader (`uploader_id`),
  INDEX idx_workflow_status_v2 (`status`),
  INDEX idx_is_locked (`is_locked`),
  INDEX idx_date_added (`date_added`),
  INDEX idx_approved_at (`approved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create document_files table (file storage metadata)
CREATE TABLE IF NOT EXISTS `document_files` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(120),
  `size_bytes` BIGINT,
  `url_path` VARCHAR(255) NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  INDEX idx_document (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
