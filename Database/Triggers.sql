-- Trigger for reducing stock of a product when an order is placed
Delimiter $$
Create trigger trg_reduce_stock
before insert on order_details
for each row 
begin
call ReduceStocks(new.PID,new.Order_Qty);
end$$
delimiter ;
-- Trigger to validate feedback
DELIMITER $$
CREATE TRIGGER trg_validate_feedback
BEFORE INSERT ON FeedBacks
FOR EACH ROW
BEGIN
    CALL ValidateFeedbackSafe(NEW.Rating, NEW.Review);
END $$
DELIMITER ;


-- Trigger to prevent negative stock
DELIMITER $$
CREATE TRIGGER trg_prevent_negative_stock
BEFORE UPDATE ON Lists
FOR EACH ROW
BEGIN
    IF NEW.Stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock cannot be negative.';
    END IF;
END $$
DELIMITER ;

-- Trigger to remove products from lists after deleted from Products relation
DELIMITER $$
CREATE TRIGGER trg_cleanup_lists
AFTER DELETE ON Products
FOR EACH ROW
BEGIN
    DELETE FROM Lists WHERE PID = OLD.PID;
END $$
DELIMITER ;

-- Trigger to increase upvotes
delimiter $$
create trigger trg_inc_upvotes
after insert on Review_Upvotes
for each row 
begin
update feedbacks
set upvotes=upvotes+1
where feedbackID =new.feedbackID;
end $$
delimiter ;

-- Trigger to decrease upvotes
delimiter $$
create trigger trg_dec_upvotes
after delete on Review_Upvotes
for each row 
begin
update feedbacks
set upvotes=upvotes-1
where feedbackID =old.feedbackID;
end $$
delimiter ;

-- Trigger to prevent self upvote
delimiter $$
create trigger trg_no_self_upvotes
after insert on Review_Upvotes
for each row 
begin
declare author varchar(100);
select emailID into author 
from feedbacks
where feedbackID= new.feedbackID;
if author=new.voteremail then
signal sqlstate '45000'
set message_text='You cannot upvote your own review';
end if;
end $$
delimiter ;