-- phpMyAdmin SQL Dump
-- version 3.3.2deb1ubuntu1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Mar 12, 2012 at 08:23 PM
-- Server version: 5.1.41
-- PHP Version: 5.3.2-1ubuntu4.14

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
-- Table structure for table `SCOTT_PILGRIM`
--

CREATE TABLE IF NOT EXISTS `SCOTT_PILGRIM` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quote` varchar(395) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=64 ;

--
-- Dumping data for table `SCOTT_PILGRIM`
--

INSERT INTO `SCOTT_PILGRIM` (`id`, `quote`) VALUES
(1, 'Stacey: Next time, we don''t date the girl with eleven evil ex-boyfriends.  Scott: It''s seven.  Stacey: Oh, well, that''s not so bad.'),
(2, 'Todd: Tell it to the cleaning lady on Monday. Scott: What? Todd: Because you''ll be dust by Monday... because you''ll be pulverized in two seconds. The cleaning lady? She cleans up... dust. She dusts. Scott: So, what''s on Monday? Todd: ''Cause... it''s Friday now, she''s the weekends off, so... Monday, right?'),
(3, 'Roxy: You punched me in the boob! Prepare to die, obviously!'),
(4, 'Kim: Scott, if your life had a face, I would punch it.'),
(5, 'Scott: Evil? You mean, do I have, like, ulterior motives? I''m offended, Kim. Kim: Wounded, even? Scott: Hurt, Kim.'),
(6, 'Roxy: I''m just a little bi-furious!'),
(7, 'Ramona: It was just a phase. Scott: You had a sexy phase?'),
(8, 'Lucas Lee: ''Sup? How''s life? He seems nice.'),
(9, 'Wallace: Step up your game, Scott. Break out the L-word. Scott: Lesbian? Wallace: The other L-word. Scott: ...Lesbians?'),
(10, 'Gideon: You made me swallow my gum! That''s going to be in my digestive tract for seven years!'),
(11, 'Wallace: Okay, presumably, you may have just seen a dude''s junk, and I''m very sorry for that... so is he.'),
(12, 'Scott: You''re pretentious, this club sucks, I have beef. Let''s do it.'),
(13, 'Stacey: You should break up with your fake high school girlfriend! Scott: Wait, who told you? Stacey: Wallace. Scott: He''s not even conscious!'),
(14, 'Scott: Bread makes you fat?'),
(15, 'Scott: You once were a ve-gone, but now you will begone. Todd: Ve-gone?'),
(16, 'Scott: That''s it! You cocky cock! You''ll pay for your crimes against humanity!'),
(17, 'Wallace: Guess who''s drunk! Scott: I guess Wallace. Wallace: You guess right!'),
(18, 'Bouncer: What''s the password? Scott: Uh, whatever... Bouncer: Cool.'),
(19, 'Young Neil: He punched the highlights out of her hair!'),
(20, 'Scott: We are Sex Bob-Omb and we are here to make you think about death and get sad and stuff!'),
(21, 'Crash: This song is called "I Am So Sad. I Am So Very Very Sad." It goes like this: SOOO SAD. Thank you.'),
(22, 'Crash: Okay, this next song goes out to the guy who keeps yelling from the balcony. It''s called "We Hate You, Please Die." Wallace: Sweet! I love this song.'),
(23, 'Ramona: Let''s both be girls.'),
(24, 'Knives: I''ve never even kissed a guy before. Scott: Hey... me neither.'),
(25, 'Lucas Lee: The only thing separating me from her is the two minutes it''s gonna take to kick your ass.'),
(26, 'Scott: I have to pee.'),
(27, 'Kim: We are Sex Bob-Omb and we''re here to watch Scott Pilgrim kick your teeth in! One-two-three-four!'),
(28, 'Scott: Amazon.ca, what''s the website for that? Wallace: Amazon.ca...'),
(29, 'Scott: If I peed my pants would you pretend that I just got wet from the rain? Ramona: It''s not raining...'),
(30, 'Knives: You broke the heart that broke mine!'),
(31, 'Scott: Wow... girl number...'),
(32, 'Scott: I have to go pee due to boredom.'),
(33, 'Roxy: Your BF''s about to get eff''d in the b!'),
(34, 'Kim: Scott Pilgrim, you''re the salt of the earth. Scott: Thanks, Kim. Kim: I''m sorry, I meant "scum" of the earth. Scott: Thanks!'),
(35, 'Wallace: Look, I didn''t write the gay handbook. If you got a problem with it, take it up with Liberace''s ghost.'),
(36, 'Scott: Dude, this thing claims I have mail. Wallace: It''s amazing what we can do with computers these days. Scott: Dude, now I''m totally reading it.'),
(37, 'Envy: You are incorrigible. Todd: I don''t know the meaning of the word. [On-screen: He really doesn''t]'),
(38, 'Scott: I don''t think I can hit a girl. They''re soft.'),
(39, 'Wallace: Hey, what''s up with his outfit? Guy in crowd: Yeah, is he a pirate? Scott: Are you a pirate? Matthew Patel: ...Pirates are in this year!'),
(40, 'Gideon: Do you have any idea how long it took me to get all the evil exes'' contact information so I could form this stupid league? Like, two hours! *Two hours!*'),
(41, 'Kim: We are Sex Bob-omb. We are here to sell out and make money and stuff.'),
(42, 'Scott: I''m in lesbians with you.'),
(43, 'Ramona: What kind of tea do you want? Scott: There''s more than one kind? Ramona: We have blueberry, raspberry, ginseng, sleepy time, green tea, green tea with lemon, green tea with lemon and honey, liver disaster, ginger with honey, ginger without honey, vanilla almond, white truffle, blueberry chamomile, vanilla walnut, constant comment and... earl grey. Scott: Did you make some of those up?'),
(44, 'Roxy: Oh I''d love to postpone, but I just cashed in my last rain check. Scott: Where''s that from? Roxy: My brain!'),
(45, 'Kim: Believe it or not, I used to date Scott in high school. Ramona: Oh? Do you have any embarrassing stories? Kim: Yeah... he''s an idiot.'),
(46, 'Matthew Patel: This is impossible. How can this be? Scott: Open your eyes. Maybe you''ll see!'),
(47, 'Knives: Steal my boyfriend, taste my steel!'),
(48, 'Scott: When I''m around you, I kind of feel like I''m on drugs. Not that I do drugs. Unless you do drugs, in which case I do them all the time. All of them.'),
(49, 'Stacey: Did you really see a future with this girl? Scott: Like... with jetpacks?'),
(50, 'Scott: I gotta pee on her!... I mean, I gotta pee. Pee time.'),
(51, 'Stephen Stills: Oh god!... oh man! This is a nightmare! Is this a nightmare? Wake up, wake up, wake up, wake up...! Scott: It''s just nerves! Pre-show jitters. Kim: Once we''re on stage, you''ll be fine. Stephen Stills: We were just on stage for sound check, and the sound guy hated us!'),
(52, 'Stephen Stills: Level with me... did we suck? Ramona: I don''t know, did you? Stephen Stills: She has to go. She knows we suck.'),
(53, 'Ramona: Well, it was nice to meet you and tell your gay friends I will see them later. Stacey: Gay friends? [Wallace and Jimmy are making out] Stacey: Wallace! Again?'),
(54, 'Stacey: 17 year old? Scandal. Scott: Who told you? Stacey: Wallace, duh. Scott: That gossipy bitch.'),
(55, 'Knives: What do you play? Young Neil: Wow, umm... Zelda... Tetris... that''s kind of a big question.'),
(56, 'Wallace: I want to have his adopted babies.'),
(57, 'Stephen Stills: I have distressing news. Kim:  Is the news that we suck, because I really don''t think I can take it.'),
(58, 'Other Scott: And you didn''t bang her? Are you gay?'),
(59, 'Crash: Hi, I''m Crash. These are the boys. Wallace: Is that girl a boy too? Crash: Yes. [girl drummer flips him off]'),
(60, 'Wallace: Hey, Jimmy, do they rock or suck? Jimmy: They have not started playing yet... Wallace: That was a test, Jimmy, and you passed. '),
(61, 'Scott: I know you play mysterious and aloof just to avoid getting hurt. And I know you have reasons for not wanting talk about your past. I want you to know that I don''t care about any of that stuff. Because I''m in lesbians with you. '),
(62, 'Scott: She was Nat when I knew her, but she stopped liking that name. Then she stopped liking me.'),
(63, 'Julie: Caramel macchiato for fucking Pilgrim. ');
