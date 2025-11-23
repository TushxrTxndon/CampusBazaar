-- ============================================
-- TRIGGER: Reduce stock when an order is placed
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_reduce_stock
BEFORE INSERT ON Order_Details
FOR EACH ROW
BEGIN
    CALL ReduceStocks(NEW.PID, NEW.Order_Qty);
END $$

DELIMITER ;



-- ============================================
-- TRIGGER: Validate feedback before insertion
-- NOTE: Your trigger calls "ValidateFeedbackSafe"
-- but your procedure is named "ValidateFeedback".
-- I am fixing it to "ValidateFeedback"
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_validate_feedback
BEFORE INSERT ON Feedbacks
FOR EACH ROW
BEGIN
    CALL ValidateFeedback(NEW.Rating, NEW.Review);
END $$

DELIMITER ;



-- ============================================
-- TRIGGER: Prevent stock from going negative
-- ============================================
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



-- ============================================
-- TRIGGER: Cleanup seller lists if product deleted
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_cleanup_lists
AFTER DELETE ON Products
FOR EACH ROW
BEGIN
    DELETE FROM Lists WHERE PID = OLD.PID;
END $$

DELIMITER ;



-- ============================================
-- TRIGGER: Increase upvotes on review upvote
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_inc_upvotes
AFTER INSERT ON Review_Upvotes
FOR EACH ROW
BEGIN
    UPDATE Feedbacks
    SET Upvotes = Upvotes + 1
    WHERE FeedBackID = NEW.FeedBackID;
END $$

DELIMITER ;



-- ============================================
-- TRIGGER: Decrease upvotes when upvote removed
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_dec_upvotes
AFTER DELETE ON Review_Upvotes
FOR EACH ROW
BEGIN
    UPDATE Feedbacks
    SET Upvotes = Upvotes - 1
    WHERE FeedBackID = OLD.FeedBackID;
END $$

DELIMITER ;



-- ============================================
-- TRIGGER: Prevent users from upvoting own review
-- ============================================
DELIMITER $$

CREATE TRIGGER trg_no_self_upvotes
AFTER INSERT ON Review_Upvotes
FOR EACH ROW
BEGIN
    DECLARE author VARCHAR(100);

    SELECT EmailID INTO author
    FROM Feedbacks
    WHERE FeedBackID = NEW.FeedBackID;

    IF author = NEW.VoterEmail THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'You cannot upvote your own review';
    END IF;
END $$

DELIMITER ;
