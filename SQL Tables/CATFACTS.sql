-- phpMyAdmin SQL Dump
-- version 3.3.2deb1ubuntu1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 11, 2012 at 10:38 PM
-- Server version: 5.1.41
-- PHP Version: 5.3.2-1ubuntu4.13

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
-- Table structure for table `CATFACTS`
--

CREATE TABLE IF NOT EXISTS `CATFACTS` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fact` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=59 ;

--
-- Dumping data for table `CATFACTS`
--

INSERT INTO `CATFACTS` (`id`, `fact`) VALUES
(1, 'Cats have five toes on each front paw, but only four toes on each back paw.'),
(2, 'Cats have true fur, in that they have both an undercoat and an outer coat.'),
(3, 'Newborn kittens have closed ear canals that don''t begin to open for nine days.When the eyes open, they are always blue at first. They change color over a period of months to the final eye color.'),
(4, 'Most cats have no eyelashes.'),
(5, 'A cat cannot see directly under its nose.'),
(6, 'You can tell a cat''s mood by looking into its eyes. A frightened or excited cat will have large, round pupils. An angry cat will have narrow pupils. The pupil size is related as much to the cat''s emotions as to the degree of light.'),
(7, 'It is a common belief that cats are color blind. However, recent studies have shown that cats can see blue, green and red.'),
(8, 'A cat can jump even seven times as high as it is tall.'),
(9, 'The cat''s footpads absorb the shocks of the landing when the cat jumps.'),
(10, 'A cat is pregnant for about 58-65 days.'),
(11, 'When well treated, a cat can live twenty or more years but the average life span of a domestic cat is 14 years.'),
(12, 'Neutering a cat extends its life span by two or three years.'),
(13, 'Cats can''t taste sweets.'),
(14, 'Cats must have fat in their diet because they can''t produce it on their own.'),
(15, 'Some common houseplants poisonous to cats include: English Ivy, iris, mistletoe, philodendron, and yew.'),
(16, 'Tylenol and chocolate are both poisonous to cats.'),
(17, 'Many cats cannot properly digest cow''s milk.'),
(18, 'The average cat food meal is the equivalent to about five mice.'),
(19, 'Cats have AB blood groups just like people.'),
(20, 'The color of the points in Siamese cats is heat related. Cool areas are darker.'),
(37, 'The chlorine in fresh tap water irritates sensitive parts of the cat''s nose. Let tap water sit for 24 hours before giving it to a cat.'),
(36, 'Today there are about 100 distinct breeds of the domestic cat.'),
(35, 'The first cat show was in 1871 at the Crystal Palace in London.'),
(34, 'In ancient Egypt, mummies were made of cats, and embalmed mice were placed with them in their tombs. In one ancient city, over 300,000 cat mummies were found.'),
(33, 'In ancient Egypt, killing a cat was a crime punishable by death.'),
(32, 'The ancestor of all domestic cats is the African Wild Cat which still exists today.'),
(31, 'Cats do not think that they are little people. They think that we are big cats. This influences their behavior in many ways.'),
(38, 'Abraham Lincoln loved cats. He had four of them while he lived in the White House.'),
(39, 'Julius Caesar, Henri II, Charles XI, and Napoleon were all afraid of cats.'),
(40, 'Cats have an average of 24 whiskers, arranged in four horizontal rows on each side.'),
(41, 'Almost 10% of a cat''s bones are in its tail, and the tail is used to maintain balance.'),
(42, 'Jaguars are the only big cats that don''t roar.'),
(43, 'A cat''s field of vision is about 185 degrees.'),
(44, 'The Maine Coon is 4 to 5 times larger than the Cingapura, the smallest breed of cat.'),
(45, 'Retractable claws are a physical phenomenon that sets cats apart from the rest of the animal kingdom. In the cat family, only cheetahs cannot retract their claws.'),
(46, 'A cat can sprint at about thirty-one miles per hour.'),
(47, 'A cat can spend five or more hours a day grooming themselves.'),
(48, 'The cat has been living in close association with humans for somewhere between 3,500 and 8,000 years.'),
(49, 'The domestic house cat is a small carnivorous mammal. Its most immediate ancestor is believed to be the African wild cat.'),
(50, 'Cats usually weigh between 2.5 and 7 kg (5.5–16 pounds), although some breeds can exceed 11.3 kg (25 pounds).'),
(51, 'Domestic cats tend to live longer if they are not permitted to go outdoors.'),
(52, 'Cats, in some cases, can sleep as much as 20 hours in a 24-hour period. The term cat nap refers to the cat''s ability to fall asleep (lightly) for a brief period.'),
(53, 'Cats dislike citrus scent.'),
(54, 'A cat''s tongue has tiny barbs on it.'),
(55, 'Cats can be right-pawed or left-pawed.'),
(56, 'It has been scientifically proven that stroking a cat can lower one''s blood pressure.'),
(57, 'Six-toed kittens are so common in Boston and surrounding areas of Massachusetts that experts consider it an established mutation.'),
(58, 'Cat families usually play best in even numbers. Cats and kittens should be acquired in pairs whenever possible.');
