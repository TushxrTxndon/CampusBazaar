-- Function to find Average rating of a product
Delimiter $$
Create function AvgProductRating(p_PID varchar(30))
returns Decimal(3,2)
deterministic
begin
declare avgR DecimaL(3,2);
select avg(Rating) Into avgR
from Feedbacks
where PID = p_PID;
return avgR;
end $$
delimiter ;
