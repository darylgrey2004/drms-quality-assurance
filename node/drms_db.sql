-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 01, 2026 at 09:43 AM
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

--
-- Dumping data for table `approval_workflow`
--

INSERT INTO `approval_workflow` (`id`, `document_id`, `stage`, `status`, `action_by`, `comments`, `created_at`, `completed_at`) VALUES
(7, 19, 'validation', 'completed', 1, NULL, '2026-04-29 19:19:53', '2026-04-29 19:19:53'),
(8, 19, 'approval', 'completed', 1, NULL, '2026-04-29 19:19:56', '2026-04-29 19:19:56'),
(9, 19, 'lock', 'completed', 1, 'ss', '2026-04-29 19:20:26', '2026-04-29 19:20:26'),
(10, 21, 'validation', 'completed', 1, NULL, '2026-04-29 20:48:11', '2026-04-29 20:48:11'),
(11, 21, 'approval', 'completed', 1, NULL, '2026-04-29 20:48:17', '2026-04-29 20:48:17'),
(12, 20, 'validation', 'completed', NULL, NULL, '2026-04-29 20:55:34', '2026-04-29 20:55:34'),
(13, 20, 'approval', 'completed', 1, NULL, '2026-04-29 20:55:54', '2026-04-29 20:55:54'),
(14, 22, 'validation', 'completed', 1, NULL, '2026-04-29 21:05:55', '2026-04-29 21:05:55'),
(15, 22, 'approval', 'completed', 1, NULL, '2026-04-29 21:06:01', '2026-04-29 21:06:01'),
(18, 22, 'lock', 'completed', NULL, NULL, '2026-04-30 19:43:55', '2026-04-30 19:43:55'),
(21, 28, 'rejection', 'completed', NULL, 'bulok siya brad', '2026-04-30 20:30:32', '2026-04-30 20:30:32'),
(22, 29, 'validation', 'completed', NULL, NULL, '2026-04-30 20:32:49', '2026-04-30 20:32:49'),
(23, 29, 'approval', 'completed', 1, NULL, '2026-04-30 20:33:02', '2026-04-30 20:33:02'),
(24, 32, 'validation', 'completed', NULL, NULL, '2026-04-30 21:10:16', '2026-04-30 21:10:16'),
(26, 32, 'approval', 'completed', 1, NULL, '2026-04-30 21:10:37', '2026-04-30 21:10:37');

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
(52, 1, 'DOCUMENT_UPLOAD', 'document', 33, NULL, '{\"title\":\"fck\",\"category\":\"research\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-02 23:15:30'),
(53, 1, 'DOCUMENT_UPLOAD', 'document', 34, NULL, '{\"title\":\"kabus\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-02 23:30:00'),
(54, 1, 'DOCUMENT_UPLOAD', 'document', 19, NULL, '{\"title\":\"Capstone Manuscript\",\"category\":\"research\",\"department\":\"bped\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:19:25'),
(55, 1, 'DOCUMENT_VALIDATED', 'document', 19, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:19:53'),
(56, 1, 'DOCUMENT_APPROVED', 'document', 19, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:19:56'),
(57, 1, 'DOCUMENT_LOCKED', 'document', 19, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"ss\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 19:20:26'),
(58, NULL, 'DOCUMENT_UPLOAD', 'document', 20, NULL, '{\"title\":\"Testing 2\",\"category\":\"extension\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:33:29'),
(59, NULL, 'DOCUMENT_VALIDATED', 'document', 20, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:55:34'),
(60, 1, 'DOCUMENT_APPROVED', 'document', 20, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:55:54'),
(61, NULL, 'DOCUMENT_UPLOAD', 'document', 21, NULL, '{\"title\":\"Source Code\",\"category\":\"employment\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:46:17'),
(62, 1, 'DOCUMENT_VALIDATED', 'document', 21, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:48:11'),
(63, 1, 'DOCUMENT_APPROVED', 'document', 21, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 20:48:17'),
(64, NULL, 'DOCUMENT_UPLOAD', 'document', 22, NULL, '{\"title\":\"C\",\"category\":\"instruction\",\"department\":\"BEED\",\"status\":\"pending\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 21:05:41'),
(65, 1, 'DOCUMENT_VALIDATED', 'document', 22, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 21:05:55'),
(66, 1, 'DOCUMENT_APPROVED', 'document', 22, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 21:06:01'),
(67, 1, 'DOCUMENT_LOCKED', 'document', 22, NULL, '{\"workflow_status\":\"locked\",\"comments\":\"\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 19:43:55');
(50, NULL, 'DOCUMENT_VALIDATED', 'document', 32, NULL, '{\"workflow_status\":\"validated\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:16'),
(51, 1, 'DOCUMENT_REJECTED', 'document', 31, NULL, '{\"workflow_status\":\"rejected\",\"reason\":\"Delete this trash\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:32'),
(52, 1, 'DOCUMENT_APPROVED', 'document', 32, NULL, '{\"workflow_status\":\"approved\"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:37'),
(53, 1, 'DOCUMENT_DELETE', 'document', 31, '{\"id\":31,\"title\":\"Faculty File Create by Admin\",\"category\":\"instruction\",\"category_id\":1,\"area\":\"No department assigned\",\"department_id\":null,\"version\":\"v1.0\",\"description\":\"dad\",\"keywords\":\"dada\",\"workflow_status\":\"rejected\",\"uploader_id\":null,\"author_name\":\"Jelmar Kemba\",\"created_at\":\"2026-04-30T21:03:35.000Z\",\"updated_at\":\"2026-04-30T21:10:32.000Z\",\"category_name\":\"instruction\",\"department_code\":\"NO DEPARTM\"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-30 21:10:49');

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
(19, 'Capstone Manuscript', 'research', 2, 'bped', 5, 'v1.0', 'sas', 'sasa', 'locked', 1, 'Admin', '2026-04-29 19:19:25', '2026-04-29 19:20:26', 'research', 'BPED'),
(20, 'Testing 2', 'extension', 3, 'BEED', 1, 'v1.0', 'sas', 'sasa', 'approved', NULL, 'Guilmar Quimba', '2026-04-29 20:33:29', '2026-04-29 21:03:42', 'extension', 'BEED'),
(21, 'Source Code', 'employment', 4, 'BEED', 1, 'v1.0', 'sdsd', 'dsd', 'approved', NULL, 'Guilmar Quimba', '2026-04-29 20:46:17', '2026-04-29 21:03:42', 'employment', 'BEED'),
(22, 'C', 'instruction', 1, 'BEED', 1, 'v1.0', 'sasa', 'sasa', 'locked', NULL, 'Guilmara Quimbar', '2026-04-29 21:05:41', '2026-04-30 19:43:55', 'instruction', 'BEED'),
(28, 'Last Testing', 'instruction', 1, 'BEED', 1, 'v1.0', 'as', 'sasa', 'rejected', NULL, 'Guilmar Quimba', '2026-04-30 20:30:00', '2026-05-01 06:25:06', 'instruction', 'BEED'),
(29, 'Capstone Vitae', 'research', 2, 'beed', 1, 'v1.0', 'Check mo', 'Check mo', 'approved', 1, 'Admin', '2026-04-30 20:31:30', '2026-04-30 20:33:02', 'research', 'BEED'),
(30, 'Faculty File', 'instruction', 1, 'BEED', 1, 'v1.0', 'dad', 'adad', 'pending', 53, 'Guilmars Quimbas', '2026-04-30 21:02:02', '2026-04-30 21:02:02', 'instruction', 'BEED'),
(32, 'Faculty File Created by Admin', 'instruction', 1, 'BEED', 1, 'v1.0', 'dad', 'dad', 'approved', NULL, 'Jelmar Kemba', '2026-04-30 21:09:44', '2026-05-01 06:56:25', 'instruction', 'BEED'),
(33, 'fck', 'research', 2, 'BEED', 1, 'v1.0', 'New uploaded document', 'fck test', 'pending', 1, 'Admin User', '2026-05-02 23:15:30', '2026-05-02 23:15:30', 'research', 'BEED'),
(34, 'kabus', 'instruction', 1, 'BEED', 1, 'v1.0', 'Test document upload', 'kabus test', 'pending', 1, 'Admin User', '2026-05-02 23:30:00', '2026-05-02 23:30:00', 'instruction', 'BEED');

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
(19, 19, 'REVISED-Present and Ready - Capstone Project Manuscript.pdf', '1777490364992-520333285-REVISED-Present and Ready - Capstone Project Manuscript.pdf', 'application/pdf', 3527186, '/uploads/1777490364992-520333285-REVISED-Present and Ready - Capstone Project Manuscript.pdf', '2026-04-29 19:19:25'),
(20, 20, 'k.pdf', '1777494809076-438449111-k.pdf', 'application/pdf', 109045, '/uploads/1777494809076-438449111-k.pdf', '2026-04-29 20:33:29'),
(21, 21, 'RELEVANT-SOURCE-CODE.pdf', '1777495577611-155887565-RELEVANT-SOURCE-CODE.pdf', 'application/pdf', 217487, '/uploads/1777495577611-155887565-RELEVANT-SOURCE-CODE.pdf', '2026-04-29 20:46:17'),
(22, 22, 'Present_And_Ready_04-04-2026.pdf', '1777496741942-442670366-Present_And_Ready_04-04-2026.pdf', 'application/pdf', 219866, '/uploads/1777496741942-442670366-Present_And_Ready_04-04-2026.pdf', '2026-04-29 21:05:41'),
(28, 28, 'Flight_Itinerary.pdf', '1777581000372-446527135-Flight_Itinerary.pdf', 'application/pdf', 804014, '/uploads/1777581000372-446527135-Flight_Itinerary.pdf', '2026-04-30 20:30:00'),
(29, 29, 'Curriculum Vitae.pdf', '1777581090038-409953167-Curriculum Vitae.pdf', 'application/pdf', 156856, '/uploads/1777581090038-409953167-Curriculum Vitae.pdf', '2026-04-30 20:31:30'),
(30, 30, 'k.pdf', '1777582922552-668674743-k.pdf', 'application/pdf', 109045, '/uploads/1777582922552-668674743-k.pdf', '2026-04-30 21:02:02'),
(32, 32, 'k.pdf', '1777583384693-522216522-k.pdf', 'application/pdf', 109045, '/uploads/1777583384693-522216522-k.pdf', '2026-04-30 21:09:44'),
(33, 33, 'fck.pdf', '1777583384694-123456789-fck.pdf', 'application/pdf', 250000, '/uploads/1777583384694-123456789-fck.pdf', '2026-05-02 23:15:30'),
(34, 34, 'kabus.pdf', '1777583384695-987654321-kabus.pdf', 'application/pdf', 180000, '/uploads/1777583384695-987654321-kabus.pdf', '2026-05-02 23:30:00');

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
(40, 63, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '243544', 'Instructor I', 'Bachelor of Elementary Education (BEED)', 'Regular / Permanent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-01 07:42:09', '2026-05-01 07:42:09');

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
(1, 'admin@wmsu.edu.ph', '$2b$10$Zl9r8XQhZaHOzO/whABiqexYU3g47YTnAyDDCjGCEmDZjjDioiG3y', 'Admin', 'User', NULL, 'admin', 'approved', 1, '2026-05-01 15:43:11', '2026-03-24 17:39:26', '2026-04-15 08:14:19'),
(23, 'qb202102102@wmsu.edu.ph', '$2b$10$8bt36e4jy2k9kDvCmAmtNeCwDawPAzdbtPvRnLz3bNB9WiDb.TpSa', 'karlos', 'valero', 'B', 'dean', 'approved', 1, '2026-04-26 14:36:00', '2026-04-20 05:20:37', NULL),
(24, 'valerocarlos030@gmail.com', '$2b$10$eVmALQHbe5XeCFDAnojZVO1RyvwIN4bSjMPERw.rpvA.ndXaG/NBC', 'karlos', 'bongcasan', 'S', 'admin', 'approved', 1, '2026-04-26 14:39:22', '2026-04-20 11:32:28', NULL),
(53, 'gwaposiguilmar@gmail.com', '$2b$10$.8wjPyy4V91/r/tt2ILnPu8U/moM1lLi.4xs6FQvxN3jh.0NaG5t2', 'Guilmars', 'Quimbas', 'a', 'faculty', 'approved', 1, '2026-05-01 05:01:42', '2026-04-30 21:01:14', NULL),
(63, 'qguilmar@gmail.com', '$2b$10$9CPc7KOEsmQv2ATyPxOnP.wGAo6mDSNKIGYjhCG2FfV70S41psbiu', 'Guilmarr', 'Quimbaa', 'A', 'department-head', 'approved', 1, '2026-05-01 15:42:29', '2026-05-01 07:42:09', NULL);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `document_comments`
--
ALTER TABLE `document_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_files`
--
ALTER TABLE `document_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `document_versions`
--
ALTER TABLE `document_versions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluator_access_limits`
--
ALTER TABLE `evaluator_access_limits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `faculty_profiles`
--
ALTER TABLE `faculty_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

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
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

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
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
