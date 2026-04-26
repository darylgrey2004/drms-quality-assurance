-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 26, 2026 at 08:47 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `drms_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `area` varchar(120) NOT NULL,
  `version` varchar(50) DEFAULT 'v1.0',
  `description` text DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `workflow_status` enum('draft','pending','validated','approved','locked','rejected') DEFAULT 'pending',
  `uploader_id` int(11) NOT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `title`, `category`, `area`, `version`, `description`, `keywords`, `workflow_status`, `uploader_id`, `author_name`, `created_at`, `updated_at`) VALUES
(1, '1231321', 'iso', 'clause5', 'v1.0', NULL, '234', 'pending', 1, 'Admin', '2026-04-20 12:35:57', '2026-04-20 12:35:57'),
(2, '1231321', 'iso', 'clause5', 'v1.0', NULL, '234', 'pending', 1, 'Admin', '2026-04-20 12:35:57', '2026-04-20 12:35:57'),
(3, '1231321', 'iso', 'clause4', 'v1.0', NULL, '234', 'pending', 1, 'Admin', '2026-04-20 12:36:29', '2026-04-20 12:36:29'),
(4, '1231321', 'iso', 'clause4', 'v1.0', NULL, '234', 'pending', 1, 'Admin', '2026-04-20 12:36:29', '2026-04-20 12:36:29'),
(5, '1231321', 'iso', 'clause4', 'v1.0', NULL, '234', 'pending', 1, 'Admin', '2026-04-20 12:36:29', '2026-04-20 12:36:29'),
(6, '1231321', 'iso', 'clause4', 'v1.0', NULL, '234', 'pending', 1, 'Admin', '2026-04-20 12:36:29', '2026-04-20 12:36:29'),
(7, 'sample ', 'aaccup', 'area10', 'v1.0', NULL, NULL, 'pending', 1, 'Admin', '2026-04-20 12:43:18', '2026-04-20 12:43:18'),
(8, 'alalalalala', 'coe', 'indicator2', 'v1.0', NULL, NULL, 'approved', 1, 'Admin', '2026-04-20 12:59:28', '2026-04-20 12:59:28'),
(9, 'alalalalala', 'coe', 'indicator2', 'v1.0', NULL, NULL, 'approved', 1, 'Admin', '2026-04-20 12:59:28', '2026-04-20 12:59:28'),
(10, 'alalalalala', 'iso', 'clause4', 'v1.0', NULL, NULL, 'pending', 1, 'Admin', '2026-04-20 13:04:12', '2026-04-20 13:04:12'),
(11, 'aADASDAS', 'iso', 'clause4', 'v1.0', NULL, NULL, 'pending', 1, 'Admin', '2026-04-20 14:19:50', '2026-04-20 14:19:50'),
(12, 'aADASDAS', 'iso', 'clause4', 'v1.0', '2131', NULL, 'pending', 1, 'Admin', '2026-04-24 15:35:35', '2026-04-24 15:35:35'),
(13, '12321313123213213', 'iso', 'clause4', 'v1.0', NULL, NULL, 'pending', 1, 'Admin', '2026-04-26 02:12:17', '2026-04-26 02:12:17'),
(14, '1231321', 'iso', 'clause4', 'v1.0', NULL, NULL, 'pending', 1, 'Admin', '2026-04-26 05:27:26', '2026-04-26 05:27:26');

-- --------------------------------------------------------

--
-- Table structure for table `document_files`
--

CREATE TABLE `document_files` (
  `id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `size_bytes` bigint(20) DEFAULT NULL,
  `url_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_files`
--

INSERT INTO `document_files` (`id`, `document_id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `url_path`, `uploaded_at`) VALUES
(1, 1, 'clearcut_img-removebg-preview.png', '1776688557166-217348373-clearcut_img-removebg-preview.png', 'image/png', 90277, '/uploads/1776688557166-217348373-clearcut_img-removebg-preview.png', '2026-04-20 12:35:57'),
(2, 2, '590152810_1616526183047578_3689746724414476402_n.jpg', '1776688557180-199325105-590152810_1616526183047578_3689746724414476402_n.jpg', 'image/jpeg', 256311, '/uploads/1776688557180-199325105-590152810_1616526183047578_3689746724414476402_n.jpg', '2026-04-20 12:35:57'),
(3, 3, 'BSIT-OJT-Internship-Endorsement-Letter copy copy.docx', '1776688589895-133265990-BSIT-OJT-Internship-Endorsement-Letter copy copy.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 193109, '/uploads/1776688589895-133265990-BSIT-OJT-Internship-Endorsement-Letter copy copy.docx', '2026-04-20 12:36:29'),
(4, 4, 'Valero RESUMEEE!!.docx', '1776688589906-52533878-Valero RESUMEEE_.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 154794, '/uploads/1776688589906-52533878-Valero RESUMEEE_.docx', '2026-04-20 12:36:29'),
(5, 5, 'Sample-resume.docx', '1776688589918-100565578-Sample-resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 31294, '/uploads/1776688589918-100565578-Sample-resume.docx', '2026-04-20 12:36:29'),
(6, 6, 'SPECIAL POWER OF ATTORNEY (sale of lot).docx', '1776688589928-555479599-SPECIAL POWER OF ATTORNEY (sale of lot).docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 18080, '/uploads/1776688589928-555479599-SPECIAL POWER OF ATTORNEY (sale of lot).docx', '2026-04-20 12:36:29'),
(7, 7, 'clearcut_img-removebg-preview.png', '1776688998150-651944541-clearcut_img-removebg-preview.png', 'image/png', 90277, '/uploads/1776688998150-651944541-clearcut_img-removebg-preview.png', '2026-04-20 12:43:18'),
(8, 8, 'Progress-Report-capstone.docx', '1776689968015-608808482-Progress-Report-capstone.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1014367, '/uploads/1776689968015-608808482-Progress-Report-capstone.docx', '2026-04-20 12:59:28'),
(9, 9, 'ProgressRepGregorio.docx', '1776689968031-957710836-ProgressRepGregorio.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 3498088, '/uploads/1776689968031-957710836-ProgressRepGregorio.docx', '2026-04-20 12:59:28'),
(10, 10, 'Valero, Social Engineering Toolkit.docx', '1776690252901-33076692-Valero_ Social Engineering Toolkit.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 31915, '/uploads/1776690252901-33076692-Valero_ Social Engineering Toolkit.docx', '2026-04-20 13:04:12'),
(11, 11, 'clearcut_img-removebg-preview.png', '1776694790549-363292548-clearcut_img-removebg-preview.png', 'image/png', 90277, '/uploads/1776694790549-363292548-clearcut_img-removebg-preview.png', '2026-04-20 14:19:50'),
(12, 12, 'clearcut_img-removebg-preview.png', '1777044935512-239112510-clearcut_img-removebg-preview.png', 'image/png', 90277, '/uploads/1777044935512-239112510-clearcut_img-removebg-preview.png', '2026-04-24 15:35:35'),
(13, 13, 'Progress-Report-capstone.docx', '1777169537744-373699920-Progress-Report-capstone.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1014367, '/uploads/1777169537744-373699920-Progress-Report-capstone.docx', '2026-04-26 02:12:17'),
(14, 14, 'BSIT-OJT-Internship-Endorsement-Letter copy copy.docx', '1777181246235-132882845-BSIT-OJT-Internship-Endorsement-Letter copy copy.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 193109, '/uploads/1777181246235-132882845-BSIT-OJT-Internship-Endorsement-Letter copy copy.docx', '2026-04-26 05:27:26');

-- --------------------------------------------------------

--
-- Table structure for table `evaluator_access_limits`
--

CREATE TABLE `evaluator_access_limits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `evaluator_access_limits`
--

INSERT INTO `evaluator_access_limits` (`id`, `user_id`, `expiresAt`, `createdAt`, `updatedAt`) VALUES
(5, 29, '2026-04-27 10:36:00', '2026-04-26 02:36:09', '2026-04-26 02:36:09');

-- --------------------------------------------------------

--
-- Table structure for table `faculty_profiles`
--

CREATE TABLE `faculty_profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `civilStatus` varchar(50) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `employeeId` varchar(100) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `employmentStatus` varchar(100) DEFAULT NULL,
  `highestDegree` varchar(255) DEFAULT NULL,
  `specialization` text DEFAULT NULL,
  `institution` varchar(255) DEFAULT NULL,
  `gradYear` int(11) DEFAULT NULL,
  `license` text DEFAULT NULL,
  `continuingEd` text DEFAULT NULL,
  `subjectsTaught` text DEFAULT NULL,
  `yearLevel` varchar(255) DEFAULT NULL,
  `loadUnits` varchar(100) DEFAULT NULL,
  `advising` text DEFAULT NULL,
  `committeeRoles` text DEFAULT NULL,
  `researchInterests` text DEFAULT NULL,
  `publications` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty_profiles`
--

INSERT INTO `faculty_profiles` (`id`, `user_id`, `dateOfBirth`, `age`, `gender`, `civilStatus`, `nationality`, `phone`, `address`, `employeeId`, `position`, `department`, `employmentStatus`, `highestDegree`, `specialization`, `institution`, `gradYear`, `license`, `continuingEd`, `subjectsTaught`, `yearLevel`, `loadUnits`, `advising`, `committeeRoles`, `researchInterests`, `publications`, `createdAt`, `updatedAt`) VALUES
(20, 22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '345676', 'Instructor I', 'Bachelor of Elementary Education (BEED)', 'Regular / Permanent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-16 04:48:40', '2026-04-16 04:48:40'),
(21, 23, '2004-03-06', 22, 'Male', 'Married', 'filipino', '09095397120', 'Tumaga zone 213', '213123', 'Instructor II', 'Bachelor of Elementary Education (BEED)', 'Regular / Permanent', 'Doctor of Education (EdD)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-20 05:20:37', '2026-04-22 03:34:17'),
(22, 24, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '213122', 'Associate Professor I', 'Bachelor of Physical Education (BPED)', 'Probationary', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-20 11:32:28', '2026-04-20 11:32:28');

-- --------------------------------------------------------

--
-- Table structure for table `otps`
--

CREATE TABLE `otps` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `expiresAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `middleInitial` varchar(10) DEFAULT NULL,
  `role` varchar(100) DEFAULT 'Faculty Member',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `lastActive` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_seen` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `firstName`, `lastName`, `middleInitial`, `role`, `status`, `isVerified`, `lastActive`, `createdAt`, `last_seen`) VALUES
(1, 'admin@wmsu.edu.ph', '$2b$10$Zl9r8XQhZaHOzO/whABiqexYU3g47YTnAyDDCjGCEmDZjjDioiG3y', 'Admin', 'User', NULL, 'admin', 'approved', 1, '2026-04-26 14:45:28', '2026-03-24 17:39:26', '2026-04-15 08:14:19'),
(22, 'eh202202503@wmsu.edu.ph', '$2b$10$4i0Nx1AnAVXFpFA7Em4xSeHnmS85x/JjETF8S.twML8Ry3i59QBaq', 'Guilmar', 'Quimba', 'A', 'Faculty Member', 'approved', 1, NULL, '2026-04-16 04:48:40', NULL),
(23, 'qb202102102@wmsu.edu.ph', '$2b$10$8bt36e4jy2k9kDvCmAmtNeCwDawPAzdbtPvRnLz3bNB9WiDb.TpSa', 'karlos', 'valero', 'B', 'Dean', 'approved', 1, '2026-04-26 14:36:00', '2026-04-20 05:20:37', NULL),
(24, 'valerocarlos030@gmail.com', '$2b$10$eVmALQHbe5XeCFDAnojZVO1RyvwIN4bSjMPERw.rpvA.ndXaG/NBC', 'karlos', 'bongcasan', 'S', 'QA Coordinator', 'approved', 1, '2026-04-26 14:39:22', '2026-04-20 11:32:28', NULL),
(29, 'camperbongcasan@gmail.com', '$2b$10$ube9ZnhDvJxllL9ezRWMueo5R/8ndrUIcF9zl8o2E/.cXgEqAyd8q', 'camper', 'valero', 'B', 'evaluator', 'approved', 1, '2026-04-26 14:36:30', '2026-04-26 02:36:09', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`workflow_status`),
  ADD KEY `idx_uploader` (`uploader_id`);

--
-- Indexes for table `document_files`
--
ALTER TABLE `document_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_document` (`document_id`);

--
-- Indexes for table `evaluator_access_limits`
--
ALTER TABLE `evaluator_access_limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `faculty_profiles`
--
ALTER TABLE `faculty_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_lastActive` (`lastActive`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `document_files`
--
ALTER TABLE `document_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `evaluator_access_limits`
--
ALTER TABLE `evaluator_access_limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `faculty_profiles`
--
ALTER TABLE `faculty_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `document_files`
--
ALTER TABLE `document_files`
  ADD CONSTRAINT `document_files_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `evaluator_access_limits`
--
ALTER TABLE `evaluator_access_limits`
  ADD CONSTRAINT `evaluator_access_limits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `faculty_profiles`
--
ALTER TABLE `faculty_profiles`
  ADD CONSTRAINT `faculty_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `otps`
--
ALTER TABLE `otps`
  ADD CONSTRAINT `otps_ibfk_1` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
