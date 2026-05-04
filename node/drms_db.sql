-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 03, 2026 at 11:31 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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
-- Table structure for table `approval_workflow`
--

CREATE TABLE `approval_workflow` (
  `id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `stage` varchar(20) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `action_by` int(11) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'DOCUMENT_UPLOAD', 'document', 15, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"research\",\"department\":\"beed\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 15:02:02'),
(2, 1, 'DOCUMENT_UPLOAD', 'document', 16, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"research\",\"department\":\"beed\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 18:39:51'),
(3, 1, 'DOCUMENT_REJECTED', 'document', 15, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"asa\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 18:55:58'),
(4, 1, 'DOCUMENT_REJECTED', 'document', 16, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"sasa\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 18:56:00'),
(5, 1, 'DOCUMENT_DELETE', 'document', 15, '{\"id\":15,\"title\":\"Relevant Source Code\",\"category\":\"research\",\"category_id\":2,\"area\":\"beed\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"da\",\"keywords\":\"dad\",\"workflow_status\":\"rejected\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-29T15:02:02.000Z\",\"updated_at\":\"2026-04-29T18:55:58.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 18:56:04'),
(6, 1, 'DOCUMENT_DELETE', 'document', 16, '{\"id\":16,\"title\":\"Relevant Source Code\",\"category\":\"research\",\"category_id\":2,\"area\":\"beed\",\"department_id\":1,\"version\":\"v2.0\",\"description\":\"dada\",\"keywords\":\"dadada\",\"workflow_status\":\"rejected\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-29T18:39:51.000Z\",\"updated_at\":\"2026-04-29T18:56:00.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 18:56:06'),
(7, 1, 'DOCUMENT_UPLOAD', 'document', 17, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"instruction\",\"department\":\"beed\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 18:56:20'),
(8, 1, 'DOCUMENT_UPLOAD', 'document', 18, NULL, '{\"title\":\"k\",\"category\":\"research\",\"department\":\"bsed\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:07:50'),
(9, 1, 'DOCUMENT_VALIDATED', 'document', 18, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:18:01'),
(10, 1, 'DOCUMENT_APPROVED', 'document', 18, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:18:04'),
(11, 1, 'DOCUMENT_LOCKED', 'document', 18, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"s\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:18:07'),
(12, 1, 'DOCUMENT_REJECTED', 'document', 17, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"secret\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:18:37'),
(13, 1, 'DOCUMENT_UPLOAD', 'document', 19, NULL, '{\"title\":\"Capstone Manuscript\",\"category\":\"research\",\"department\":\"bped\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:19:25'),
(14, 1, 'DOCUMENT_VALIDATED', 'document', 19, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:19:53'),
(15, 1, 'DOCUMENT_APPROVED', 'document', 19, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:19:56'),
(16, 1, 'DOCUMENT_LOCKED', 'document', 19, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"ss\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:20:26'),
(17, NULL, 'DOCUMENT_UPLOAD', 'document', 20, NULL, '{\"title\":\"Testing 2\",\"category\":\"extension\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:33:29'),
(18, NULL, 'DOCUMENT_UPLOAD', 'document', 21, NULL, '{\"title\":\"Source Code\",\"category\":\"employment\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:46:17'),
(19, 1, 'DOCUMENT_VALIDATED', 'document', 21, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:48:11'),
(20, 1, 'DOCUMENT_APPROVED', 'document', 21, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:48:17'),
(21, NULL, 'DOCUMENT_VALIDATED', 'document', 20, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:55:34'),
(22, 1, 'DOCUMENT_APPROVED', 'document', 20, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:55:54'),
(23, NULL, 'DOCUMENT_UPLOAD', 'document', 22, NULL, '{\"title\":\"C\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 21:05:41'),
(24, 1, 'DOCUMENT_VALIDATED', 'document', 22, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 21:05:56'),
(25, 1, 'DOCUMENT_APPROVED', 'document', 22, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 21:06:01'),
(26, 1, 'DOCUMENT_UPLOAD', 'document', 23, NULL, '{\"title\":\"Certificate\",\"category\":\"research\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:12:25'),
(27, 1, 'DOCUMENT_DELETE', 'document', 23, '{\"id\":23,\"title\":\"Certificate\",\"category\":\"research\",\"category_id\":2,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"dada\",\"keywords\":\"dada\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-30T19:12:25.000Z\",\"updated_at\":\"2026-04-30T19:12:25.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:12:30'),
(28, 1, 'DOCUMENT_UPLOAD', 'document', 24, NULL, '{\"title\":\"Certificate\",\"category\":\"research\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:12:43'),
(29, NULL, 'DOCUMENT_UPLOAD', 'document', 25, NULL, '{\"title\":\"Testing 2.2\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:26:36'),
(30, NULL, 'DOCUMENT_VALIDATED', 'document', 24, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:28:15'),
(31, NULL, 'DOCUMENT_REJECTED', 'document', 25, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"Kasi ko nag send nito kaya yaw ko\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:34:44'),
(32, NULL, 'DOCUMENT_LOCKED', 'document', 22, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:43:55'),
(33, NULL, 'DOCUMENT_UPLOAD', 'document', 26, NULL, '{\"title\":\"Relevant\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:45:02'),
(34, 1, 'DOCUMENT_DELETE', 'document', 26, '{\"id\":26,\"title\":\"Relevant\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"dada\",\"workflow_status\":\"approved\",\"uploader_id\":49,\"author_name\":\"Guilmar Quimba\",\"created_at\":\"2026-04-30T19:45:02.000Z\",\"updated_at\":\"2026-04-30T19:45:02.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:45:32'),
(35, NULL, 'DOCUMENT_UPLOAD', 'document', 27, NULL, '{\"title\":\"Lupad\",\"category\":\"extension\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:54:23'),
(36, 1, 'DOCUMENT_DELETE', 'document', 25, '{\"id\":25,\"title\":\"Testing 2.2\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"dada\",\"workflow_status\":\"rejected\",\"uploader_id\":49,\"author_name\":\"Guilmar Quimba\",\"created_at\":\"2026-04-30T19:26:36.000Z\",\"updated_at\":\"2026-04-30T19:34:44.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:06:38'),
(37, 1, 'DOCUMENT_DELETE', 'document', 17, '{\"id\":17,\"title\":\"Relevant Source Code\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"beed\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"da\",\"keywords\":\"dad\",\"workflow_status\":\"rejected\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-29T18:56:20.000Z\",\"updated_at\":\"2026-04-29T19:18:37.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:06:41'),
(38, NULL, 'DOCUMENT_REJECTED', 'document', 27, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"bulok gawa mo brad\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:07:03'),
(39, 1, 'DOCUMENT_DELETE', 'document', 27, '{\"id\":27,\"title\":\"Lupad\",\"category\":\"extension\",\"category_id\":3,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"da\",\"keywords\":\"dad\",\"workflow_status\":\"rejected\",\"uploader_id\":49,\"author_name\":\"Guilmar Quimba\",\"created_at\":\"2026-04-30T19:54:23.000Z\",\"updated_at\":\"2026-04-30T20:07:03.000Z\",\"category_name\":\"extension\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:15:02'),
(40, 1, 'DOCUMENT_REJECTED', 'document', 24, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"sasas\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:24:01'),
(41, 1, 'DOCUMENT_DELETE', 'document', 24, '{\"id\":24,\"title\":\"Certificate\",\"category\":\"research\",\"category_id\":2,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"dad\",\"workflow_status\":\"rejected\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-30T19:12:43.000Z\",\"updated_at\":\"2026-04-30T20:24:01.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:27:28'),
(42, NULL, 'DOCUMENT_UPLOAD', 'document', 28, NULL, '{\"title\":\"Last Testing\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:30:00'),
(43, NULL, 'DOCUMENT_REJECTED', 'document', 28, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"bulok siya brad\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:30:32'),
(44, 1, 'DOCUMENT_UPLOAD', 'document', 29, NULL, '{\"title\":\"Capstone Vitae\",\"category\":\"research\",\"department\":\"beed\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:31:30'),
(45, NULL, 'DOCUMENT_VALIDATED', 'document', 29, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:32:49'),
(46, 1, 'DOCUMENT_APPROVED', 'document', 29, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 20:33:02'),
(47, 53, 'DOCUMENT_UPLOAD', 'document', 30, NULL, '{\"title\":\"Faculty File\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:02:02'),
(48, NULL, 'DOCUMENT_UPLOAD', 'document', 31, NULL, '{\"title\":\"Faculty File Create by Admin\",\"category\":\"instruction\",\"department\":\"No department assigned\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:03:35'),
(49, NULL, 'DOCUMENT_UPLOAD', 'document', 32, NULL, '{\"title\":\"Faculty File Created by Admin\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:09:44'),
(50, NULL, 'DOCUMENT_VALIDATED', 'document', 32, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:16'),
(51, 1, 'DOCUMENT_REJECTED', 'document', 31, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"Delete this trash\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:32'),
(52, 1, 'DOCUMENT_APPROVED', 'document', 32, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:37'),
(53, 1, 'DOCUMENT_DELETE', 'document', 31, '{\"id\":31,\"title\":\"Faculty File Create by Admin\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"No department assigned\",\"department_id\":null,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"dada\",\"workflow_status\":\"rejected\",\"uploader_id\":null,\"author_name\":\"Jelmar Kemba\",\"created_at\":\"2026-04-30T21:03:35.000Z\",\"updated_at\":\"2026-04-30T21:10:32.000Z\",\"category_name\":\"instruction\",\"department_code\":\"NO DEPARTM\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:49'),
(54, 64, 'DOCUMENT_UPLOAD', 'document', 33, NULL, '{\"title\":\"CRIMSON\",\"category\":\"extension\",\"department\":\"BCAED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 16:32:17'),
(55, 1, 'DOCUMENT_VALIDATED', 'document', 33, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 16:32:45'),
(56, 1, 'DOCUMENT_APPROVED', 'document', 33, NULL, '{\"workflow_status\":\"approved\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 16:33:03'),
(57, 1, 'DOCUMENT_LOCKED', 'document', 33, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 16:33:14'),
(58, 64, 'DOCUMENT_UPLOAD', 'document', 34, NULL, '{\"title\":\"helloworld\",\"category\":\"employment\",\"department\":\"BCAED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 17:03:28'),
(59, NULL, 'DOCUMENT_UPLOAD', 'document', 35, NULL, '{\"title\":\"fordept\",\"category\":\"research\",\"department\":\"BPED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 18:25:03'),
(60, NULL, 'DOCUMENT_VALIDATED', 'document', 35, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-01 18:25:17'),
(61, 1, 'DOCUMENT_UPLOAD', 'document', 36, NULL, '{\"title\":\"SOURCE CODE\",\"category\":\"research\",\"department\":\"BSED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 03:33:24'),
(62, 64, 'DOCUMENT_UPLOAD', 'document', 37, NULL, '{\"title\":\"SOURCE CODES 2025\",\"category\":\"extension\",\"department\":\"BCAED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 03:37:12'),
(63, 1, 'DOCUMENT_VALIDATED', 'document', 37, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 03:40:55'),
(64, 1, 'DOCUMENT_APPROVED', 'document', 37, NULL, '{\"workflow_status\":\"approved\",\"comments\":\"yes\\n\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 03:55:26'),
(65, NULL, 'DOCUMENT_UPLOAD', 'document', 38, NULL, '{\"title\":\"CRIMSON\",\"category\":\"instruction\",\"department\":\"BPED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 06:55:26'),
(66, 64, 'DOCUMENT_UPLOAD', 'document', 39, NULL, '{\"title\":\"helloworld121323\",\"category\":\"employment\",\"department\":\"BCAED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 07:54:12'),
(67, 64, 'DOCUMENT_UPLOAD', 'document', 40, NULL, '{\"title\":\"helloworld121323\",\"category\":\"employment\",\"department\":\"BCAED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 08:04:59'),
(68, 68, 'DOCUMENT_VALIDATED', 'document', 40, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:05:27'),
(69, 68, 'DOCUMENT_APPROVED', 'document', 40, NULL, '{\"workflow_status\":\"approved\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:05:31'),
(70, 68, 'DOCUMENT_LOCKED', 'document', 40, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:05:37'),
(71, 68, 'DOCUMENT_APPROVED', 'document', 35, NULL, '{\"workflow_status\":\"approved\",\"comments\":\"yes\\n\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:19:04'),
(72, 1, 'DOCUMENT_UPLOAD', 'document', 41, NULL, '{\"title\":\"fishycakes\",\"category\":\"research\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:19:57'),
(73, 1, 'DOCUMENT_LOCKED', 'document', 37, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:24:59'),
(74, 1, 'DOCUMENT_LOCKED', 'document', 35, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:25:02'),
(75, 1, 'DOCUMENT_LOCKED', 'document', 32, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 11:25:04'),
(76, 1, 'PASSWORD_CHANGED', 'user', 1, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-02 12:41:07'),
(77, 1, 'DOCUMENT_UPLOAD', 'document', 42, NULL, '{\"title\":\"meowmy\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:32:30'),
(78, 1, 'DOCUMENT_UPLOAD', 'document', 43, NULL, '{\"title\":\"fordept232\",\"category\":\"research\",\"department\":\"BSED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:33:26'),
(79, 1, 'DOCUMENT_UPLOAD', 'document', 44, NULL, '{\"title\":\"helloworld22\",\"category\":\"research\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:34:01'),
(80, 1, 'DOCUMENT_DELETE', 'document', 44, '{\"id\":44,\"title\":\"helloworld22\",\"category\":\"research\",\"category_id\":2,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"hello??\",\"keywords\":\"yesand\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-03T07:34:01.000Z\",\"updated_at\":\"2026-05-03T07:34:01.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:35:08'),
(81, 1, 'DOCUMENT_DELETE', 'document', 43, '{\"id\":43,\"title\":\"fordept232\",\"category\":\"research\",\"category_id\":2,\"area\":\"BSED\",\"department_id\":2,\"version\":\"v1.0\",\"description\":\"neow\",\"keywords\":\"SYLLABUS\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-03T07:33:26.000Z\",\"updated_at\":\"2026-05-03T07:33:26.000Z\",\"category_name\":\"research\",\"department_code\":\"BSED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:35:13'),
(82, 1, 'DOCUMENT_DELETE', 'document', 42, '{\"id\":42,\"title\":\"meowmy\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":null,\"keywords\":null,\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-03T07:32:30.000Z\",\"updated_at\":\"2026-05-03T07:32:30.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:35:16'),
(83, 1, 'DOCUMENT_DELETE', 'document', 41, '{\"id\":41,\"title\":\"fishycakes\",\"category\":\"research\",\"category_id\":2,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"yes\",\"keywords\":\"and?\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-02T11:19:57.000Z\",\"updated_at\":\"2026-05-02T11:19:57.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:35:19'),
(84, 1, 'DOCUMENT_UPLOAD', 'document', 45, NULL, '{\"title\":\"meowmy\",\"category\":\"instruction\",\"department\":\"BPED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', '2026-05-03 07:41:35'),
(85, 1, 'DOCUMENT_UPLOAD', 'document', 46, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:18'),
(86, 1, 'DOCUMENT_DELETE', 'document', 45, '{\"id\":45,\"title\":\"meowmy\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BPED\",\"department_id\":5,\"version\":\"v1.0\",\"description\":\"hellaur\",\"keywords\":\"yes\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-03T07:41:35.000Z\",\"updated_at\":\"2026-05-03T07:41:35.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BPED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:33'),
(87, 1, 'DOCUMENT_DELETE', 'document', 40, '{\"id\":40,\"title\":\"helloworld121323\",\"category\":\"employment\",\"category_id\":4,\"area\":\"BCAED\",\"department_id\":4,\"version\":\"v2.0\",\"description\":\"hello\",\"keywords\":\"hello\",\"workflow_status\":\"locked\",\"uploader_id\":64,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-02T08:04:59.000Z\",\"updated_at\":\"2026-05-02T11:05:37.000Z\",\"category_name\":\"employment\",\"department_code\":\"BCAED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:35'),
(88, 1, 'DOCUMENT_DELETE', 'document', 39, '{\"id\":39,\"title\":\"helloworld121323\",\"category\":\"employment\",\"category_id\":4,\"area\":\"BCAED\",\"department_id\":4,\"version\":\"v1.0\",\"description\":\"halu\",\"keywords\":\"world\",\"workflow_status\":\"pending\",\"uploader_id\":64,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-02T07:54:12.000Z\",\"updated_at\":\"2026-05-02T07:54:12.000Z\",\"category_name\":\"employment\",\"department_code\":\"BCAED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:36'),
(89, 1, 'DOCUMENT_DELETE', 'document', 38, '{\"id\":38,\"title\":\"CRIMSON\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BPED\",\"department_id\":5,\"version\":\"v1.0\",\"description\":\"meow\",\"keywords\":null,\"workflow_status\":\"pending\",\"uploader_id\":null,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-02T06:55:26.000Z\",\"updated_at\":\"2026-05-02T07:52:04.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BPED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:38'),
(90, 1, 'DOCUMENT_DELETE', 'document', 37, '{\"id\":37,\"title\":\"SOURCE CODES 2025\",\"category\":\"extension\",\"category_id\":3,\"area\":\"BCAED\",\"department_id\":4,\"version\":\"v1.0\",\"description\":\"HElOoo\",\"keywords\":\"meowm\",\"workflow_status\":\"locked\",\"uploader_id\":64,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-02T03:37:12.000Z\",\"updated_at\":\"2026-05-02T11:24:59.000Z\",\"category_name\":\"extension\",\"department_code\":\"BCAED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:39'),
(91, 1, 'DOCUMENT_DELETE', 'document', 36, '{\"id\":36,\"title\":\"SOURCE CODE\",\"category\":\"research\",\"category_id\":2,\"area\":\"BSED\",\"department_id\":2,\"version\":\"v1.0\",\"description\":\"meow\",\"keywords\":\"research\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-02T03:33:24.000Z\",\"updated_at\":\"2026-05-02T03:33:24.000Z\",\"category_name\":\"research\",\"department_code\":\"BSED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:41'),
(92, 1, 'DOCUMENT_DELETE', 'document', 35, '{\"id\":35,\"title\":\"fordept\",\"category\":\"research\",\"category_id\":2,\"area\":\"BPED\",\"department_id\":5,\"version\":\"v1.0\",\"description\":\"yow\",\"keywords\":\"meme\",\"workflow_status\":\"locked\",\"uploader_id\":null,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-01T18:25:03.000Z\",\"updated_at\":\"2026-05-02T11:25:02.000Z\",\"category_name\":\"research\",\"department_code\":\"BPED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:42'),
(93, 1, 'DOCUMENT_DELETE', 'document', 34, '{\"id\":34,\"title\":\"helloworld\",\"category\":\"employment\",\"category_id\":4,\"area\":\"BCAED\",\"department_id\":4,\"version\":\"v1.0\",\"description\":\"nope\",\"keywords\":null,\"workflow_status\":\"pending\",\"uploader_id\":64,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-01T17:03:28.000Z\",\"updated_at\":\"2026-05-01T17:03:28.000Z\",\"category_name\":\"employment\",\"department_code\":\"BCAED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:43'),
(94, 1, 'DOCUMENT_DELETE', 'document', 33, '{\"id\":33,\"title\":\"CRIMSON\",\"category\":\"extension\",\"category_id\":3,\"area\":\"BCAED\",\"department_id\":4,\"version\":\"v1.0\",\"description\":\"hey\",\"keywords\":\"world\",\"workflow_status\":\"locked\",\"uploader_id\":64,\"author_name\":\"Daryl Gregorio\",\"created_at\":\"2026-05-01T16:32:17.000Z\",\"updated_at\":\"2026-05-01T16:33:14.000Z\",\"category_name\":\"extension\",\"department_code\":\"BCAED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:45'),
(95, 1, 'DOCUMENT_DELETE', 'document', 32, '{\"id\":32,\"title\":\"Faculty File Created by Admin\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"dad\",\"workflow_status\":\"locked\",\"uploader_id\":null,\"author_name\":\"Jelmar Kemba\",\"created_at\":\"2026-04-30T21:09:44.000Z\",\"updated_at\":\"2026-05-02T11:25:04.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:46'),
(96, 1, 'DOCUMENT_DELETE', 'document', 30, '{\"id\":30,\"title\":\"Faculty File\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"adad\",\"workflow_status\":\"pending\",\"uploader_id\":53,\"author_name\":\"Guilmars Quimbas\",\"created_at\":\"2026-04-30T21:02:02.000Z\",\"updated_at\":\"2026-04-30T21:02:02.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:48'),
(97, 1, 'DOCUMENT_DELETE', 'document', 29, '{\"id\":29,\"title\":\"Capstone Vitae\",\"category\":\"research\",\"category_id\":2,\"area\":\"beed\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"Check mo\",\"keywords\":\"Check mo\",\"workflow_status\":\"approved\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-30T20:31:30.000Z\",\"updated_at\":\"2026-04-30T20:33:02.000Z\",\"category_name\":\"research\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:49'),
(98, 1, 'DOCUMENT_DELETE', 'document', 28, '{\"id\":28,\"title\":\"Last Testing\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"as\",\"keywords\":\"sasa\",\"workflow_status\":\"rejected\",\"uploader_id\":null,\"author_name\":\"Guilmar Quimba\",\"created_at\":\"2026-04-30T20:30:00.000Z\",\"updated_at\":\"2026-05-01T06:25:06.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:51'),
(99, 1, 'DOCUMENT_DELETE', 'document', 22, '{\"id\":22,\"title\":\"C\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"sasa\",\"keywords\":\"sasa\",\"workflow_status\":\"locked\",\"uploader_id\":null,\"author_name\":\"Guilmara Quimbar\",\"created_at\":\"2026-04-29T21:05:41.000Z\",\"updated_at\":\"2026-04-30T19:43:55.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:53'),
(100, 1, 'DOCUMENT_DELETE', 'document', 21, '{\"id\":21,\"title\":\"Source Code\",\"category\":\"employment\",\"category_id\":4,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"sdsd\",\"keywords\":\"dsd\",\"workflow_status\":\"approved\",\"uploader_id\":null,\"author_name\":\"Guilmar Quimba\",\"created_at\":\"2026-04-29T20:46:17.000Z\",\"updated_at\":\"2026-04-29T21:03:42.000Z\",\"category_name\":\"employment\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:54'),
(101, 1, 'DOCUMENT_DELETE', 'document', 20, '{\"id\":20,\"title\":\"Testing 2\",\"category\":\"extension\",\"category_id\":3,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"sas\",\"keywords\":\"sasa\",\"workflow_status\":\"approved\",\"uploader_id\":null,\"author_name\":\"Guilmar Quimba\",\"created_at\":\"2026-04-29T20:33:29.000Z\",\"updated_at\":\"2026-04-29T21:03:42.000Z\",\"category_name\":\"extension\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:56'),
(102, 1, 'DOCUMENT_DELETE', 'document', 19, '{\"id\":19,\"title\":\"Capstone Manuscript\",\"category\":\"research\",\"category_id\":2,\"area\":\"bped\",\"department_id\":5,\"version\":\"v1.0\",\"description\":\"sas\",\"keywords\":\"sasa\",\"workflow_status\":\"locked\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-29T19:19:25.000Z\",\"updated_at\":\"2026-04-29T19:20:26.000Z\",\"category_name\":\"research\",\"department_code\":\"BPED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:30:58'),
(103, 1, 'DOCUMENT_DELETE', 'document', 18, '{\"id\":18,\"title\":\"k\",\"category\":\"research\",\"category_id\":2,\"area\":\"bsed\",\"department_id\":2,\"version\":\"v1.0\",\"description\":\"dada\",\"keywords\":\"dada\",\"workflow_status\":\"locked\",\"uploader_id\":1,\"author_name\":\"Admin\",\"created_at\":\"2026-04-29T19:07:50.000Z\",\"updated_at\":\"2026-04-29T19:18:07.000Z\",\"category_name\":\"research\",\"department_code\":\"BSED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:31:03'),
(104, 1, 'DOCUMENT_UPLOAD', 'document', 47, NULL, '{\"title\":\"Testing 2\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:38:43'),
(105, 1, 'DOCUMENT_DELETE', 'document', 47, '{\"id\":47,\"title\":\"Testing 2\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"BEED\",\"department_id\":1,\"version\":\"v1.0\",\"description\":\"Sstandard test\",\"keywords\":\"ss\",\"workflow_status\":\"pending\",\"uploader_id\":1,\"author_name\":\"Admin User\",\"created_at\":\"2026-05-03T20:38:43.000Z\",\"updated_at\":\"2026-05-03T20:38:43.000Z\",\"category_name\":\"instruction\",\"department_code\":\"BEED\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:42:55'),
(106, 1, 'DOCUMENT_UPLOAD', 'document', 48, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"research\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 20:43:28'),
(107, 1, 'DOCUMENT_UPLOAD', 'document', 49, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"extension\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 21:21:18'),
(108, 1, 'DOCUMENT_UPLOAD', 'document', 50, NULL, '{\"title\":\"Relevant Source Code\",\"category\":\"employment\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-03 21:22:32');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `display_name`, `description`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'instruction', 'Instruction', 'Teaching and learning materials, syllabi, curriculum documents', 1, 1, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(2, 'research', 'Research', 'Research publications, papers, studies, and outputs', 2, 1, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(3, 'extension', 'Extension', 'Community outreach programs and extension services', 3, 1, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(4, 'employment', 'Employment', 'Employment contracts, personnel records, HR documents', 4, 1, '2026-04-29 11:23:47', '2026-04-29 11:23:47');

-- --------------------------------------------------------

--
-- Table structure for table `category_requirements`
--

CREATE TABLE `category_requirements` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `expected_documents` int(11) NOT NULL DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 1,
  `academic_year` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category_requirements`
--

INSERT INTO `category_requirements` (`id`, `category_id`, `department_id`, `expected_documents`, `is_required`, `academic_year`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 45, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(2, 1, 2, 65, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(3, 1, 3, 40, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(4, 1, 4, 35, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(5, 1, 5, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(6, 2, 1, 40, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(7, 2, 2, 55, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(8, 2, 3, 35, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(9, 2, 4, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(10, 2, 5, 25, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(11, 3, 1, 25, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(12, 3, 2, 25, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(13, 3, 3, 25, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(14, 3, 4, 25, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(15, 3, 5, 25, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(16, 4, 1, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(17, 4, 2, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(18, 4, 3, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(19, 4, 4, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47'),
(20, 4, 5, 30, 1, NULL, '2026-04-29 11:23:47', '2026-04-29 11:23:47');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_stats`
--

CREATE TABLE `dashboard_stats` (
  `id` int(11) NOT NULL,
  `stat_key` varchar(100) NOT NULL,
  `stat_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`stat_value`)),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `code`, `name`, `description`, `is_active`, `created_at`) VALUES
(1, 'BEED', 'Bachelor of Elementary Education', 'Elementary Education Department', 1, '2026-04-29 11:23:47'),
(2, 'BSED', 'Bachelor of Secondary Education', 'Secondary Education Department', 1, '2026-04-29 11:23:47'),
(3, 'BSNED', 'Bachelor of Special Needs Education', 'Special Needs Education Department', 1, '2026-04-29 11:23:47'),
(4, 'BCAED', 'Bachelor of Culture and Arts Education', 'Culture and Arts Education Department', 1, '2026-04-29 11:23:47'),
(5, 'BPED', 'Bachelor of Physical Education', 'Physical Education Department', 1, '2026-04-29 11:23:47');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `area` varchar(120) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `version` varchar(50) DEFAULT 'v1.0',
  `description` text DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `workflow_status` enum('draft','pending','validated','approved','locked','rejected') DEFAULT 'pending',
  `uploader_id` int(11) DEFAULT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category_name` varchar(50) DEFAULT NULL,
  `department_code` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `title`, `category`, `category_id`, `area`, `department_id`, `version`, `description`, `keywords`, `workflow_status`, `uploader_id`, `author_name`, `created_at`, `updated_at`, `category_name`, `department_code`) VALUES
(46, 'Relevant Source Code', 'instruction', 1, 'BEED', 1, 'v1.0', 'Testing 1', 'Testing', 'pending', 1, 'Admin User', '2026-05-03 20:30:18', '2026-05-03 20:30:18', 'instruction', 'BEED'),
(48, 'Relevant Source Code', 'research', 2, 'BEED', 1, 'v1.0', 'Testing Standard', NULL, 'pending', 1, 'Admin User', '2026-05-03 20:43:28', '2026-05-03 20:43:28', 'research', 'BEED'),
(49, 'Relevant Source Code', 'extension', 3, 'BEED', 1, 'v1.0', 'Testing', NULL, 'pending', 1, 'Admin User', '2026-05-03 21:21:18', '2026-05-03 21:21:18', 'extension', 'BEED'),
(50, 'Relevant Source Code', 'employment', 4, 'BEED', 1, 'v1.0', 'Testing', NULL, 'pending', 1, 'Admin User', '2026-05-03 21:22:32', '2026-05-03 21:22:32', 'employment', 'BEED');

-- --------------------------------------------------------

--
-- Table structure for table `document_comments`
--

CREATE TABLE `document_comments` (
  `id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(46, 46, 'RELEVANT-SOURCE-CODE.pdf', '1777840218270-851396344-RELEVANT-SOURCE-CODE.pdf', 'application/pdf', 217487, '/uploads/1777840218270-851396344-RELEVANT-SOURCE-CODE.pdf', '2026-05-03 20:30:18'),
(48, 48, 'RELEVANT-SOURCE-CODE.pdf', '1777841008117-89817441-RELEVANT-SOURCE-CODE.pdf', 'application/pdf', 217487, '/uploads/1777841008117-89817441-RELEVANT-SOURCE-CODE.pdf', '2026-05-03 20:43:28'),
(49, 49, 'RELEVANT-SOURCE-CODE.pdf', '1777843278602-150295857-RELEVANT-SOURCE-CODE.pdf', 'application/pdf', 217487, '/uploads/1777843278602-150295857-RELEVANT-SOURCE-CODE.pdf', '2026-05-03 21:21:18'),
(50, 50, 'RELEVANT-SOURCE-CODE.pdf', '1777843352521-503314220-RELEVANT-SOURCE-CODE.pdf', 'application/pdf', 217487, '/uploads/1777843352521-503314220-RELEVANT-SOURCE-CODE.pdf', '2026-05-03 21:22:32');

-- --------------------------------------------------------

--
-- Table structure for table `document_standards`
--

CREATE TABLE `document_standards` (
  `id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `standard_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_standards`
--

INSERT INTO `document_standards` (`id`, `document_id`, `standard_id`, `created_at`) VALUES
(1, 46, 1, '2026-05-03 20:40:19'),
(3, 48, 7, '2026-05-03 20:43:28'),
(4, 49, 13, '2026-05-03 21:21:18'),
(5, 50, 18, '2026-05-03 21:22:32');

-- --------------------------------------------------------

--
-- Table structure for table `document_versions`
--

CREATE TABLE `document_versions` (
  `id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `version_number` varchar(20) NOT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `changes_description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(9, 67, '2027-01-01 09:00:00', '2026-05-01 18:12:43', '2026-05-01 18:12:43');

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
(21, 23, '2004-03-06', 22, 'Male', 'Married', 'filipino', '09095397120', 'Tumaga zone 213', '213123', 'Instructor II', 'Bachelor of Elementary Education (BEED)', 'Regular / Permanent', 'Doctor of Education (EdD)', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-20 05:20:37', '2026-04-22 03:34:17'),
(22, 24, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '213122', 'Associate Professor I', 'Bachelor of Physical Education (BPED)', 'Probationary', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-20 11:32:28', '2026-04-20 11:32:28'),
(32, 53, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '123456', 'Instructor I', 'Bachelor of Elementary Education (BEED)', 'Regular / Permanent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-30 21:01:14', '2026-04-30 21:01:14'),
(40, 63, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '243544', 'Instructor I', 'Bachelor of Elementary Education (BEED)', 'Regular / Permanent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-01 07:42:09', '2026-05-01 07:42:09'),
(41, 64, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BCAED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-01 16:30:55', '2026-05-01 16:30:55'),
(43, 69, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BCAED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-02 07:52:48', '2026-05-02 07:52:48');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `related_entity_type` varchar(50) DEFAULT NULL,
  `related_entity_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Table structure for table `standards`
--

CREATE TABLE `standards` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `standards`
--

INSERT INTO `standards` (`id`, `category_id`, `name`, `code`, `description`, `sort_order`, `is_required`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Curriculum Development', 'INST-CURDEV', 'Curriculum development documents and plans', 1, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(2, 1, 'Teaching Materials', 'INST-TEACHMAT', 'Teaching materials and instructional resources', 2, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(3, 1, 'Assessment Tools', 'INST-ASSESS', 'Assessment tools and evaluation instruments', 3, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(4, 1, 'Learning Modules', 'INST-LEARNMOD', 'Learning modules and self-instructional materials', 4, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(5, 1, 'Syllabi', 'INST-SYLLABI', 'Course syllabi and outlines', 5, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(6, 1, 'Lesson Plans', 'INST-LESSON', 'Daily lesson plans and preparation', 6, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(7, 2, 'Publications', 'RES-PUB', 'Research publications in journals and conferences', 1, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(8, 2, 'Research Proposals', 'RES-PROP', 'Research proposals and concept papers', 2, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(9, 2, 'Ethics Clearance', 'RES-ETHICS', 'Ethics clearance and approval documents', 3, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(10, 2, 'Research Outputs', 'RES-OUTPUT', 'Completed research outputs and findings', 4, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(11, 2, 'Grants and Funding', 'RES-GRANTS', 'Research grants and funding documentation', 5, 0, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(12, 2, 'Conference Presentations', 'RES-CONF', 'Conference presentations and proceedings', 6, 0, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(13, 3, 'Community Programs', 'EXT-COMM', 'Community outreach and extension programs', 1, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(14, 3, 'Outreach Documentation', 'EXT-OUTREACH', 'Outreach activity documentation and reports', 2, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(15, 3, 'Impact Assessment', 'EXT-IMPACT', 'Impact assessment and evaluation reports', 3, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(16, 3, 'Partnership Agreements', 'EXT-PARTNER', 'Partnership agreements and MOUs', 4, 0, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(17, 3, 'Beneficiary Feedback', 'EXT-FEEDBACK', 'Beneficiary feedback and satisfaction surveys', 5, 0, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(18, 4, 'Employment Contracts', 'EMP-CONTRACT', 'Employment contracts and agreements', 1, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(19, 4, 'Personnel Records', 'EMP-RECORDS', 'Personnel records and 201 files', 2, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(20, 4, 'Benefits Documentation', 'EMP-BENEFITS', 'Benefits documentation and claims', 3, 1, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(21, 4, 'Performance Reviews', 'EMP-PERFORM', 'Performance reviews and evaluations', 4, 0, 1, '2026-05-03 09:51:22', '2026-05-03 09:51:22'),
(22, 1, 'Course Outlines', 'INST-OUTLINE', 'Detailed course outlines and schedules', 7, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(23, 1, 'Instructional Videos', 'INST-VIDEO', 'Video lectures and instructional media', 8, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(24, 1, 'Student Workbooks', 'INST-WORKBOOK', 'Student workbooks and activity sheets', 9, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(25, 1, 'Teaching Guides', 'INST-GUIDE', 'Teacher guides and manuals', 10, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(26, 2, 'Research Data', 'RES-DATA', 'Research data sets and analysis', 7, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(27, 2, 'Literature Reviews', 'RES-LITREV', 'Comprehensive literature reviews', 8, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(28, 2, 'Research Instruments', 'RES-INSTR', 'Survey instruments and questionnaires', 9, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(29, 2, 'Thesis and Dissertations', 'RES-THESIS', 'Graduate thesis and dissertation works', 10, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(30, 3, 'Training Materials', 'EXT-TRAINING', 'Community training materials and modules', 6, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(31, 3, 'Extension Reports', 'EXT-REPORT', 'Quarterly and annual extension reports', 7, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(32, 3, 'Service Learning', 'EXT-SERVICE', 'Service learning activities and documentation', 8, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(33, 3, 'Community Needs Assessment', 'EXT-NEEDS', 'Community needs assessment studies', 9, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(34, 3, 'Sustainability Plans', 'EXT-SUSTAIN', 'Program sustainability and continuation plans', 10, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(35, 4, 'Training Certificates', 'EMP-TRAINING', 'Professional development and training certificates', 5, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(36, 4, 'Job Descriptions', 'EMP-JOBDESC', 'Position descriptions and specifications', 6, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(37, 4, 'Appointment Letters', 'EMP-APPOINT', 'Appointment and promotion letters', 7, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(38, 4, 'Leave Records', 'EMP-LEAVE', 'Leave applications and records', 8, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(39, 4, 'Clearance Documents', 'EMP-CLEAR', 'Clearance and separation documents', 9, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08'),
(40, 4, 'Service Records', 'EMP-SERVICE', 'Service records and certifications', 10, 0, 1, '2026-05-03 20:54:08', '2026-05-03 20:54:08');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` varchar(50) DEFAULT 'string',
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 'sla_validation_hours', '48', 'integer', 'Hours allowed for validation stage', '2026-04-29 11:23:47'),
(2, 'sla_approval_hours', '72', 'integer', 'Hours allowed for approval stage', '2026-04-29 11:23:47'),
(3, 'max_upload_size_mb', '25', 'integer', 'Maximum file upload size in MB', '2026-04-29 11:23:47'),
(4, 'allowed_file_types', 'pdf,docx,xlsx,jpg,jpeg,png', 'string', 'Allowed file extensions', '2026-04-29 11:23:47'),
(5, 'maintenance_mode', 'false', 'boolean', 'System maintenance mode flag', '2026-04-29 11:23:47');

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
  `role` enum('admin','dean','department-head','faculty','evaluator') NOT NULL,
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
(1, 'admin@wmsu.edu.ph', '$2b$10$dRzwA7Flcu3EGiNMi977meHQbO6i.pmrXL1lN/Wpmadi2mhtB1Uka', 'Admin', 'User', NULL, 'admin', 'approved', 1, '2026-05-04 05:30:48', '2026-03-24 17:39:26', '2026-04-15 08:14:19'),
(23, 'qb202102102@wmsu.edu.ph', '$2b$10$8bt36e4jy2k9kDvCmAmtNeCwDawPAzdbtPvRnLz3bNB9WiDb.TpSa', 'karlos', 'valero', 'B', 'dean', 'approved', 1, '2026-04-26 14:36:00', '2026-04-20 05:20:37', NULL),
(24, 'valerocarlos030@gmail.com', '$2b$10$eVmALQHbe5XeCFDAnojZVO1RyvwIN4bSjMPERw.rpvA.ndXaG/NBC', 'karlos', 'bongcasan', 'S', 'admin', 'approved', 1, '2026-04-26 14:39:22', '2026-04-20 11:32:28', NULL),
(53, 'gwaposiguilmar@gmail.com', '$2b$10$.8wjPyy4V91/r/tt2ILnPu8U/moM1lLi.4xs6FQvxN3jh.0NaG5t2', 'Guilmars', 'Quimbas', 'a', 'faculty', 'approved', 1, '2026-05-01 05:01:42', '2026-04-30 21:01:14', NULL),
(63, 'qguilmar@gmail.com', '$2b$10$9CPc7KOEsmQv2ATyPxOnP.wGAo6mDSNKIGYjhCG2FfV70S41psbiu', 'Guilmarr', 'Quimbaa', 'A', 'department-head', 'approved', 1, '2026-05-01 15:42:29', '2026-05-01 07:42:09', NULL),
(64, 'eh202200781@wmsu.edu.ph', '$2b$10$Jun4Q2JgSc4rc6oYX0an/uzGuTleH8EHsqAFLQ1HIVljER/P.vs6S', 'Daryl', 'Gregorio', NULL, 'faculty', 'approved', 1, '2026-05-02 19:44:27', '2026-05-01 16:30:55', NULL),
(67, 'banana@gmail.com', '$2b$10$hvwy5OLrRWtPxDu7Bv/Ul.DwxctMVjcwGhHtb9AGL.ac2CgBliXpm', 'Daryl', 'Gregorio', NULL, 'evaluator', 'approved', 1, '2026-05-02 13:44:52', '2026-05-01 18:12:43', NULL),
(68, 'banana1@gmail.com', '$2b$10$UpeeeTCzlPDvXQB2wgYxYOqDeTIVkSZMd3M4iywdRl0XBWFlF4VwS', 'memaw', 'hello', NULL, 'dean', 'approved', 1, '2026-05-02 19:12:26', '2026-05-02 04:58:02', NULL),
(69, 'eh202200782@wmsu.edu.ph', '$2b$10$M4AM7NB5Iniv4MMG2snQ4.M2ZU1wbsgt4OtaCwYD2uyR8KrLHXN.m', 'Daryl', 'Gregorio', NULL, 'department-head', 'approved', 1, '2026-05-02 14:55:28', '2026-05-02 07:52:48', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval_workflow`
--
ALTER TABLE `approval_workflow`
  ADD PRIMARY KEY (`id`),
  ADD KEY `action_by` (`action_by`),
  ADD KEY `idx_approval_document` (`document_id`),
  ADD KEY `idx_approval_stage` (`stage`,`status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_created` (`created_at`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `category_requirements`
--
ALTER TABLE `category_requirements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_department` (`category_id`,`department_id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `dashboard_stats`
--
ALTER TABLE `dashboard_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stat_key` (`stat_key`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_status` (`workflow_status`),
  ADD KEY `idx_uploader` (`uploader_id`),
  ADD KEY `idx_documents_category` (`category_id`),
  ADD KEY `idx_documents_department` (`department_id`),
  ADD KEY `idx_documents_status` (`workflow_status`),
  ADD KEY `idx_documents_uploader` (`uploader_id`);

--
-- Indexes for table `document_comments`
--
ALTER TABLE `document_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_id` (`document_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `document_files`
--
ALTER TABLE `document_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_document` (`document_id`);

--
-- Indexes for table `document_standards`
--
ALTER TABLE `document_standards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_document_standard` (`document_id`,`standard_id`),
  ADD KEY `idx_doc_standard_document` (`document_id`),
  ADD KEY `idx_doc_standard_standard` (`standard_id`);

--
-- Indexes for table `document_versions`
--
ALTER TABLE `document_versions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `document_id` (`document_id`),
  ADD KEY `created_by` (`created_by`);

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
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`,`is_read`);

--
-- Indexes for table `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`);

--
-- Indexes for table `standards`
--
ALTER TABLE `standards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_standard` (`category_id`,`code`),
  ADD KEY `idx_standards_category` (`category_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_lastActive` (`lastActive`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approval_workflow`
--
ALTER TABLE `approval_workflow`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `category_requirements`
--
ALTER TABLE `category_requirements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `dashboard_stats`
--
ALTER TABLE `dashboard_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `document_comments`
--
ALTER TABLE `document_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_files`
--
ALTER TABLE `document_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `document_standards`
--
ALTER TABLE `document_standards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `document_versions`
--
ALTER TABLE `document_versions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluator_access_limits`
--
ALTER TABLE `evaluator_access_limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `faculty_profiles`
--
ALTER TABLE `faculty_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `otps`
--
ALTER TABLE `otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `standards`
--
ALTER TABLE `standards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval_workflow`
--
ALTER TABLE `approval_workflow`
  ADD CONSTRAINT `approval_workflow_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_workflow_ibfk_2` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `category_requirements`
--
ALTER TABLE `category_requirements`
  ADD CONSTRAINT `category_requirements_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `category_requirements_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `document_comments`
--
ALTER TABLE `document_comments`
  ADD CONSTRAINT `document_comments_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `document_files`
--
ALTER TABLE `document_files`
  ADD CONSTRAINT `document_files_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `document_standards`
--
ALTER TABLE `document_standards`
  ADD CONSTRAINT `document_standards_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_standards_ibfk_2` FOREIGN KEY (`standard_id`) REFERENCES `standards` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `document_versions`
--
ALTER TABLE `document_versions`
  ADD CONSTRAINT `document_versions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `document_versions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

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
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `otps`
--
ALTER TABLE `otps`
  ADD CONSTRAINT `otps_ibfk_1` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE;

--
-- Constraints for table `standards`
--
ALTER TABLE `standards`
  ADD CONSTRAINT `standards_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
