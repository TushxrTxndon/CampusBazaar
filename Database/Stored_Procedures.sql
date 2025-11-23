-- ============================================
-- PROCEDURE: ReduceStocks
-- Reduces stock of a product after an order
-- ============================================
DELIMITER $$

CREATE PROCEDURE ReduceStocks(
    IN p_PID VARCHAR(30),
    IN p_Qty INT
)
BEGIN
    DECLARE available INT;

    SELECT Stock INTO available
    FROM Lists
    WHERE PID = p_PID
    LIMIT 1;

    IF available IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Product not found in seller list';
    END IF;

    IF available < p_Qty THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for this product';
    END IF;

    UPDATE Lists
    SET Stock = Stock - p_Qty
    WHERE PID = p_PID;
END $$

DELIMITER ;



-- ============================================
-- PROCEDURE: AddProduct
-- Adds a product to seller's list
-- ============================================
DELIMITER $$

CREATE PROCEDURE AddProduct(
    IN p_EmailID VARCHAR(100),
    IN p_PID VARCHAR(30),
    IN p_Stock INT
)
BEGIN
    IF p_Stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock cannot be negative';
    END IF;

    INSERT INTO Lists (EmailID, PID, Stock)
    VALUES (p_EmailID, p_PID, p_Stock);
END $$

DELIMITER ;



-- ============================================
-- PROCEDURE: AssignCategory
-- Assigns a category to a product
-- ============================================
DELIMITER $$

CREATE PROCEDURE AssignCategory(
    IN p_PID VARCHAR(30),
    IN p_CategoryID INT
)
BEGIN
    INSERT INTO Product_Category (PID, CategoryID)
    VALUES (p_PID, p_CategoryID);
END $$

DELIMITER ;



-- ============================================
-- PROCEDURE: ValidateFeedback
-- Validates rating and review text
-- ============================================
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
