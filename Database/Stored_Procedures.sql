-- Procedure to reduce stocks after an order
Delimiter $$
Create procedure ReduceStocks(
IN P_pid varchar(30),
IN p_qty INT)
begin
declare available INT;
select stock into available
from lists 
where PID=P_pid
limit 1;
if available is null then
signal sqlstate '45000'
set message_text= 'Product not found in seller List';
end if;
if available < p_qty then
signal sqlstate '45000'
set message_text= 'Insufficient stock for this product';
end if;
update lists
set stock =stock - p_qty
where PID=P_pid;
end$$
delimiter ;

-- Procedure to add a new product to lists
Delimiter $$
Create procedure AddProduct(
IN p_EmailID varchar(100),
IN P_pid varchar(30),
IN p_stock INT)
begin
if p_stock< 0 then
signal sqlstate '45000'
set message_text= 'Stock cannot be negative';
end if;
Insert into lists(EmailID,PID,Stock)
values (p_EmailID ,p_pid ,p_stock);
end$$
delimiter ;

-- Procedure to assign category to product
delimiter $$
Create procedure AssignCategory(
IN p_PID varchar(30),
IN p_CategoryID INT)
begin
Insert into Product_Category(PID,CategoryID) VALUES(p_PID, p_CategoryID);
END $$
DELIMITER ;

-- Procedure to validate feedbacks
DELIMITER $$
CREATE PROCEDURE ValidateFeedback(
    IN p_Rating INT,
    IN p_Review TEXT
)
BEGIN
    IF p_Rating < 1 OR p_Rating > 5 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Rating must be between 1 and 5.';
    END IF;

    IF p_Review IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Review cannot be empty.';
    END IF;
END $$
DELIMITER ;
