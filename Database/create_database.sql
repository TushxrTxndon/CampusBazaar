-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS CampusBazaar;
USE CampusBazaar;

-- ============================
-- USERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Users (
    EmailID VARCHAR(100) PRIMARY KEY,
    FirstName VARCHAR(30) NOT NULL,
    LastName VARCHAR(30) NOT NULL,
    Password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- STUDENT TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Student (
    EnrollmentNo VARCHAR(50) PRIMARY KEY,
    Course VARCHAR(30) NOT NULL,
    Batch VARCHAR(5) NOT NULL,
    EmailID VARCHAR(100) NOT NULL,
    FOREIGN KEY (EmailID) REFERENCES Users(EmailID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- FACULTY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Faculty (
    FacultyID VARCHAR(50) PRIMARY KEY,
    Department VARCHAR(30),
    Designation VARCHAR(20),
    EmailID VARCHAR(100) NOT NULL,
    FOREIGN KEY (EmailID) REFERENCES Users(EmailID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- PRODUCTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Products (
    PID VARCHAR(30) PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    Description TEXT NOT NULL,
    Price DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- PRODUCT IMAGES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Product_Images (
    ImageID INT AUTO_INCREMENT PRIMARY KEY,
    PID VARCHAR(30) NOT NULL,
    ImageURL VARCHAR(255) NOT NULL,
    DisplayOrder INT DEFAULT 0,
    FOREIGN KEY (PID) REFERENCES Products(PID) ON DELETE CASCADE,
    INDEX idx_pid (PID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- LISTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Lists (
    EmailID VARCHAR(100),
    PID VARCHAR(30),
    Stock INT DEFAULT 0 CHECK (Stock >= 0),
    PRIMARY KEY (EmailID, PID),
    FOREIGN KEY (EmailID) REFERENCES Users(EmailID) ON DELETE CASCADE,
    FOREIGN KEY (PID) REFERENCES Products(PID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- FEEDBACKS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Feedbacks (
    FeedBackID INT PRIMARY KEY,
    Date DATE,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Review TEXT,
    Upvotes INT DEFAULT 0 CHECK (Upvotes >= 0),
    EmailID VARCHAR(100) NOT NULL,
    PID VARCHAR(30) NOT NULL,
    FOREIGN KEY (PID) REFERENCES Products(PID) ON DELETE CASCADE,
    FOREIGN KEY (EmailID) REFERENCES Users(EmailID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- REVIEW UPVOTES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Review_Upvotes (
    UpvoteID INT AUTO_INCREMENT PRIMARY KEY,
    FeedBackID INT NOT NULL,
    VoterEmail VARCHAR(100) NOT NULL,
    UNIQUE (FeedBackID, VoterEmail),
    FOREIGN KEY (FeedBackID) REFERENCES Feedbacks(FeedBackID) ON DELETE CASCADE,
    FOREIGN KEY (VoterEmail) REFERENCES Users(EmailID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- CATEGORY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Category (
    CategoryID INT PRIMARY KEY,
    CategoryName VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- PRODUCT CATEGORY TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Product_Category (
    PID VARCHAR(30),
    CategoryID INT,
    PRIMARY KEY (PID, CategoryID),
    FOREIGN KEY (PID) REFERENCES Products(PID) ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- ORDERS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Orders (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    OrderDate DATE NOT NULL,
    EmailID VARCHAR(100) NOT NULL,
    FOREIGN KEY (EmailID) REFERENCES Users(EmailID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- ORDER DETAILS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS Order_Details (
    OrderID INT,
    PID VARCHAR(30),
    Order_Qty INT NOT NULL CHECK (Order_Qty > 0),
    PRIMARY KEY (OrderID, PID),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (PID) REFERENCES Products(PID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
