-- phpMyAdmin SQL Dump
-- version 3.3.2deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jan 06, 2012 at 10:27 AM
-- Server version: 5.1.41
-- PHP Version: 5.3.2-1ubuntu4.11

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `nodejs_mysql_sparkle`
--

-- --------------------------------------------------------

--
-- Table structure for table `HOLIDAY_GREETINGS`
--

CREATE TABLE IF NOT EXISTS `HOLIDAY_GREETINGS` (
  `date` date NOT NULL,
  `greeting` varchar(255) NOT NULL,
  PRIMARY KEY (`date`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `HOLIDAY_GREETINGS`
--

INSERT INTO `HOLIDAY_GREETINGS` (`date`, `greeting`) VALUES
('2012-01-02', 'Happy New Year'),
('2012-01-01', 'Happy New Year'),
('2012-01-16', 'Happy Martin Luther King, Jr. Day'),
('2012-02-20', 'Happy President''s Day'),
('2012-05-28', 'Happy Memorial Day'),
('2012-07-04', 'Happy Independence Day'),
('2012-09-03', 'Happy Labor Day'),
('2012-10-08', 'Happy Columbus Day'),
('2012-11-11', 'Happy Veterans Day'),
('2012-11-22', 'Happy Thanksgiving'),
('2012-12-24', 'Merry Christmas'),
('2012-12-25', 'Merry Christmas'),
('2012-02-21', 'Happy Mardi Gras'),
('2012-02-02', 'Happy Groundhog Day'),
('2012-02-14', 'Happy Valentine''s Day'),
('2012-03-17', 'Happy St. Patrick''s Day'),
('2012-04-08', 'Happy Easter'),
('2012-04-22', 'Happy Earth Day'),
('2012-04-27', 'Happy Arbor Day'),
('2012-05-01', 'Happy May Day'),
('2012-05-05', 'Feliz Cinco de Mayo'),
('2012-05-13', 'Happy Mother''s Day'),
('2012-05-24', 'Happy Slavic National Holiday'),
('2012-06-14', 'Happy Flag Day'),
('2012-06-17', 'Happy Father''s Day'),
('2012-06-21', 'Happy Solstice'),
('2012-06-28', 'Happy Stonewall Day'),
('2012-08-26', 'Happy Women''s Equality Day'),
('2012-09-17', 'Happy Constitution Day'),
('2012-09-19', 'Ahoy'),
('2012-10-09', 'Happy Leif Erikson Day'),
('2012-10-31', 'Happy Halloween'),
('2012-11-06', 'Go vote'),
('2012-12-21', 'Happy Solstice'),
('2012-01-23', 'Happy Chinese New Year'),
('2012-02-01', 'Happy National Freedom Day'),
('2012-03-08', 'Happy International Women''s Day'),
('2012-03-11', 'Happy 3/11 Day'),
('2012-03-20', 'Happy Vernal Equinox'),
('2012-03-21', 'Happy World Poetry Day'),
('2012-03-22', 'Happy World Water Day'),
('2012-03-23', 'Happy World Meteorological Day'),
('2012-03-25', 'Happy Maryland Day'),
('2012-04-12', 'Happy Human Space Flight Day'),
('2012-04-25', 'Happy Administrative Professionals Day'),
('2012-05-03', 'Happy World Press Freedom Day'),
('2012-05-14', 'Happy World Migratory Bird Day'),
('2012-05-22', 'Happy National Maritime Day'),
('2012-06-08', 'Happy World Oceans Day'),
('2012-07-22', 'Happy Parents'' Day'),
('2012-07-30', 'Happy World Friendship Day'),
('2012-08-12', 'Happy International Youth Day'),
('2012-09-22', 'Happy Autumnal Equinox'),
('2012-11-04', 'Set your clocks back'),
('2012-11-10', 'Happy World Science Day'),
('2012-11-20', 'Happy Universal Children''s Day'),
('2012-11-21', 'Happy World Television Day'),
('2012-12-09', 'Happy Hanukkah'),
('2012-12-10', 'Happy Holidays'),
('2012-12-11', 'Happy Holidays'),
('2012-12-12', 'Happy Holidays'),
('2012-12-13', 'Happy Holidays'),
('2012-12-14', 'Happy Monkey Day'),
('2012-12-15', 'Happy Holidays'),
('2012-12-16', 'Happy Holidays'),
('2012-12-17', 'Happy Holidays'),
('2012-12-18', 'Happy Holidays'),
('2012-12-19', 'Happy Holidays'),
('2012-12-20', 'Happy Holidays'),
('2012-12-22', 'Happy Holidays'),
('2012-12-23', 'Happy Festivus'),
('2012-12-26', 'Happy Holidays'),
('2012-12-27', 'Happy Holidays'),
('2012-12-28', 'Happy Holidays'),
('2012-12-29', 'Happy Holidays'),
('2012-12-30', 'Happy Holidays'),
('2012-12-31', 'Happy New Year'),
('2012-01-11', 'Happy World Laughter Day'),
('2012-01-28', 'Happy Data Privacy Day'),
('2012-03-09', 'Happy Middle Name Pride Day'),
('2012-03-14', 'Happy Pi Day'),
('2012-05-25', 'Happy Towel Day'),
('2012-05-26', 'Happy Paper Airplane Day'),
('2012-07-27', 'Happy System Administrator Appreciation Day'),
('2012-09-01', 'Happy Bacon Day'),
('2012-09-16', 'Happy Software Freedom Day'),
('2012-10-11', 'Happy National Coming Out Day'),
('2012-04-20', 'Happy 420 Day'),
('2012-06-25', 'Happy National Catfish Day'),
('2012-10-29', 'Happy National Cat Day'),
('2012-01-05', 'Happy National Bird Day'),
('2012-01-07', 'Happy Harlem Globetrotters Day');
