-- ============================================
-- Function: AvgProductRating
-- Returns average rating of a given product
-- ============================================

DELIMITER $$

CREATE FUNCTION AvgProductRating(p_PID VARCHAR(30))
RETURNS DECIMAL(3,2)
DETERMINISTIC
BEGIN
    DECLARE avgR DECIMAL(3,2);

    SELECT AVG(Rating) INTO avgR
    FROM Feedbacks
    WHERE PID = p_PID;

    RETURN avgR;
END $$

DELIMITER ;
