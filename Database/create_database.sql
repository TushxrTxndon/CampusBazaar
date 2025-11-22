Create Database IF NOT EXISTS CampusBazaar;
Use CampusBazaar;
Create table Users(
EmailID varchar(100) primary key,
FirstName varchar(30) NOT NULL,
LastName varchar(30) NOT NULL,
Password varchar(255) NOT NULL)
ENGINE =InnoDB DEFAULT charset=utf8mb4;

Create table Student(
EnrollmentNo varchar(50) primary key,
Course varchar(30) NOT NULL,
Batch varchar(5) NOT NULL,
EmailID varchar(100) NOT NULL,
foreign key(EmailID) references Users(EmailID) ON delete cascade)
ENGINE =InnoDB DEFAULT charset=utf8mb4;

Create table Faculty(
FacultyID varchar(50) primary key,
Department varchar(30),
Designation varchar(20),
EmailID varchar(100) NOT NULL,
foreign key(EmailID) references Users(EmailID) ON delete cascade)
ENGINE =InnoDB DEFAULT charset=utf8mb4;

Create Table Products(
PID varchar(30) primary key,
ProductName varchar(100) NOT NULL,
Description TEXT NOT NULL,
Price DECIMAL(10,2) NOT NULL)
ENGINE =InnoDB DEFAULT charset=utf8mb4;

Create table Lists(
EmailID varchar(100),
PID varchar(30),
Stock INT Default 0 Check (Stock>=0),
PRIMARY KEY(EmailID,PID),
foreign key(EmailID) references Users(EmailID) ON delete cascade,
foreign key(PID) references Products(PID) ON delete cascade)
ENGINE =InnoDB DEFAULT charset=utf8mb4;

Create table FeedBacks(
FeedBackID INT primary key,
Date DATE,
Rating INT CHECK(Rating between 1 and 5),
Review Text,
Upvotes INT default 0 Check(Upvotes>=0),
EmailID varchar(100) NOT NULL,
PID varchar(30) NOT NULL,
foreign key(PID) references Products(PID) ON delete cascade,
foreign key(EmailID) references Users(EmailID) ON delete cascade)
ENGINE =InnoDB DEFAULT charset=utf8mb4;

CREATE TABLE Review_Upvotes (
    UpvoteID INT AUTO_INCREMENT PRIMARY KEY,
    FeedBackID INT NOT NULL,
    VoterEmail VARCHAR(100) NOT NULL,
    UNIQUE (FeedBackID, VoterEmail),
    FOREIGN KEY (FeedBackID) REFERENCES Feedbacks(FeedBackID) ON DELETE CASCADE,
    FOREIGN KEY (VoterEmail) REFERENCES Users(EmailID) ON DELETE CASCADE
)ENGINE =InnoDB DEFAULT charset=utf8mb4;


Create table Category(
CategoryID INT primary key,
CategoryName varchar(50) NOT NULL
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

Create table Product_Category(
PID varchar(30),
CategoryID INT,
Primary key(PID, CategoryID),
foreign key(PID) references Products(PID) ON DELETE CASCADE,
foreign key(CategoryID) references Category(CategoryID) ON DELETE CASCADE)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

Create table Orders(
OrderID INT AUTO_INCREMENT primary key,
OrderDate DATE NOT NULL,
EmailID varchar(100) NOT NULL,
foreign key(EmailID) references Users(EmailID) ON DELETE CASCADE)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

Create table Order_Details(
OrderID INT,
PID varchar(30),
Order_Qty INT NOT NULL CHECK(Order_Qty>0),
Primary key(OrderID,PID),
foreign key(OrderID) references Orders(OrderID) ON DELETE CASCADE,
foreign key(PID) references Products(PID) ON DELETE CASCADE)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
