from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from db import get_db
import mysql.connector
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/payments", tags=["Payments"])

# In-memory storage for OTPs (in production, use Redis or database)
otp_storage = {}

# Email configuration (for demo - using Gmail SMTP)
# In production, use environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "your-email@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "your-app-password")

class PaymentInitiate(BaseModel):
    EmailID: EmailStr
    Amount: float
    OrderID: int

class OTPVerify(BaseModel):
    EmailID: EmailStr
    OTP: str
    OrderID: int

class ResendOTPRequest(BaseModel):
    email_id: EmailStr
    order_id: int

def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_email(to_email: str, subject: str, body: str):
    """Send email using SMTP"""
    try:
        # Check if email credentials are configured
        if EMAIL_USER == "your-email@gmail.com" or EMAIL_PASSWORD == "your-app-password":
            # Demo mode: print email to console
            print(f"\n{'='*60}")
            print(f"📧 EMAIL (DEMO MODE - Not actually sent)")
            print(f"{'='*60}")
            print(f"TO: {to_email}")
            print(f"SUBJECT: {subject}")
            print(f"BODY:\n{body}")
            print(f"{'='*60}\n")
            print("⚠️  To enable actual email sending, configure EMAIL_USER and EMAIL_PASSWORD in .env")
            return True
        
        # Actual email sending
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Email sending error: {e}")
        # In demo mode, still return True so flow continues
        # In production, you might want to raise an exception or log to monitoring service
        if EMAIL_USER == "your-email@gmail.com" or EMAIL_PASSWORD == "your-app-password":
            return True
        # Log error but don't fail the request in production
        # You can uncomment below to raise exception in production
        # raise HTTPException(500, f"Failed to send email: {str(e)}")
        return False

def get_user_name(email_id: str):
    """Get user's full name from database"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT FirstName, LastName FROM Users WHERE EmailID = %s", (email_id,))
        user = cursor.fetchone()
        if user:
            return f"{user['FirstName']} {user['LastName']}"
        return "Customer"
    except:
        return "Customer"
    finally:
        cursor.close()
        conn.close()

@router.post("/initiate")
def initiate_payment(payment: PaymentInitiate):
    """Initiate payment and send OTP to user's registered email"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify order exists and get registered email
        cursor.execute("SELECT OrderID, EmailID FROM Orders WHERE OrderID = %s", (payment.OrderID,))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(404, "Order not found")
        
        # Use the registered email from the order (not from request)
        registered_email = order["EmailID"]
        
        # Verify the email matches (security check)
        if registered_email != payment.EmailID:
            raise HTTPException(403, "Order does not belong to this user")
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP with expiration (5 minutes)
        otp_storage[registered_email] = {
            "otp": otp,
            "order_id": payment.OrderID,
            "amount": payment.Amount,
            "expires_at": datetime.now() + timedelta(minutes=5)
        }
        
        # Get user name
        user_name = get_user_name(registered_email)
        
        # Send OTP email to registered email
        email_subject = "CampusBazaar - Payment OTP"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6366f1;">CampusBazaar Payment Verification</h2>
                <p>Hello {user_name},</p>
                <p>You have initiated a payment of <strong>₹{payment.Amount:.2f}</strong> for Order #{payment.OrderID}.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Your OTP is:</p>
                    <h1 style="margin: 10px 0; font-size: 32px; color: #6366f1; letter-spacing: 5px;">{otp}</h1>
                    <p style="margin: 0; font-size: 12px; color: #999;">Valid for 5 minutes</p>
                </div>
                <p style="color: #666; font-size: 14px;">Please enter this OTP to complete your payment.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't initiate this payment, please ignore this email or contact support immediately.</p>
            </div>
        </body>
        </html>
        """
        
        send_email(registered_email, email_subject, email_body)
        
        return {
            "message": "OTP sent to your registered email",
            "email": registered_email,
            "expires_in": 300  # 5 minutes in seconds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to initiate payment: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.post("/verify")
def verify_payment(otp_data: OTPVerify):
    """Verify OTP and process payment"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if OTP exists
        if otp_data.EmailID not in otp_storage:
            raise HTTPException(400, "OTP not found. Please request a new OTP.")
        
        stored_data = otp_storage[otp_data.EmailID]
        
        # Check expiration
        if datetime.now() > stored_data["expires_at"]:
            del otp_storage[otp_data.EmailID]
            raise HTTPException(400, "OTP has expired. Please request a new one.")
        
        # Verify order ID matches
        if stored_data["order_id"] != otp_data.OrderID:
            raise HTTPException(400, "Invalid order ID")
        
        # Verify OTP
        if stored_data["otp"] != otp_data.OTP:
            raise HTTPException(400, "Invalid OTP")
        
        # OTP verified - process payment (demo: just mark as paid)
        # In real implementation, integrate with payment gateway
        
        # Get order details for confirmation email
        cursor.execute("""
            SELECT o.OrderID, o.OrderDate, o.EmailID,
                   SUM(od.Order_Qty * p.Price) as Total
            FROM Orders o
            INNER JOIN Order_Details od ON o.OrderID = od.OrderID
            INNER JOIN Products p ON od.PID = p.PID
            WHERE o.OrderID = %s
            GROUP BY o.OrderID, o.OrderDate, o.EmailID
        """, (otp_data.OrderID,))
        order = cursor.fetchone()
        
        cursor.execute("""
            SELECT p.ProductName, od.Order_Qty, p.Price
            FROM Order_Details od
            INNER JOIN Products p ON od.PID = p.PID
            WHERE od.OrderID = %s
        """, (otp_data.OrderID,))
        order_items = cursor.fetchall()
        
        # Get user name
        user_name = get_user_name(otp_data.EmailID)
        
        # Send payment confirmation email to registered email
        items_html = ""
        total = 0
        for item in order_items:
            item_total = item[1] * item[2]
            total += item_total
            items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{item[0]}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item[1]}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹{item[2]:.2f}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹{item_total:.2f}</td>
            </tr>
            """
        
        # Format order date
        order_date = order[1]
        if isinstance(order_date, datetime):
            order_date_str = order_date.strftime("%B %d, %Y at %I:%M %p")
        else:
            order_date_str = str(order_date)
        
        email_subject = "CampusBazaar - Payment Confirmed! 🎉"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #10b981; font-size: 48px; margin: 0;">✓</h1>
                    <h2 style="color: #6366f1; margin-top: 10px;">Payment Confirmed!</h2>
                </div>
                
                <p>Hello {user_name},</p>
                <p style="font-size: 16px; color: #10b981; font-weight: bold;">Your payment of <strong>₹{stored_data['amount']:.2f}</strong> has been processed successfully!</p>
                <p>Your order has been confirmed and will be processed shortly.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #6366f1;">Order Details</h3>
                    <p><strong>Order ID:</strong> #{otp_data.OrderID}</p>
                    <p><strong>Order Date:</strong> {order_date_str}</p>
                    <p><strong>Payment Amount:</strong> ₹{stored_data['amount']:.2f}</p>
                    <p><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: bold;">Completed</span></p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #6366f1;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background: #6366f1; color: white;">
                                <th style="padding: 12px; text-align: left;">Product</th>
                                <th style="padding: 12px; text-align: center;">Quantity</th>
                                <th style="padding: 12px; text-align: right;">Price</th>
                                <th style="padding: 12px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f9fafb;">
                                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #6366f1; font-size: 16px;">Total Amount:</td>
                                <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #6366f1; font-size: 16px; color: #6366f1;">₹{total:.2f}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="background: #eff6ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;"><strong>What's Next?</strong></p>
                    <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 14px;">Your order is being processed. You will receive updates on your order status via email.</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">Thank you for shopping with CampusBazaar!</p>
                <p style="color: #999; font-size: 12px; margin-top: 10px;">If you have any questions, please contact our support team.</p>
            </div>
        </body>
        </html>
        """
        
        # Send confirmation email to registered email
        send_email(otp_data.EmailID, email_subject, email_body)
        
        # Remove OTP from storage
        del otp_storage[otp_data.EmailID]
        
        return {
            "message": "Payment successful",
            "order_id": otp_data.OrderID,
            "amount": stored_data["amount"],
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Payment verification failed: {str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.post("/resend-otp")
def resend_otp(request: ResendOTPRequest):
    """Resend OTP to user's email"""
    email_id = request.email_id
    order_id = request.order_id
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify order exists
        cursor.execute("SELECT OrderID, EmailID FROM Orders WHERE OrderID = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            raise HTTPException(404, "Order not found")
        
        # Use registered email from order
        registered_email = order["EmailID"]
        
        # Verify the email matches (security check)
        if registered_email != email_id:
            raise HTTPException(403, "Order does not belong to this user")
        
        # Get order total
        cursor.execute("""
            SELECT SUM(od.Order_Qty * p.Price) as Total
            FROM Order_Details od
            INNER JOIN Products p ON od.PID = p.PID
            WHERE od.OrderID = %s
        """, (order_id,))
        result = cursor.fetchone()
        amount = float(result["Total"]) if result["Total"] else 0.0
        
        # Generate new OTP
        otp = generate_otp()
        
        # Store OTP with expiration
        otp_storage[registered_email] = {
            "otp": otp,
            "order_id": order_id,
            "amount": amount,
            "expires_at": datetime.now() + timedelta(minutes=5)
        }
        
        # Get user name
        user_name = get_user_name(registered_email)
        
        # Send OTP email to registered email
        email_subject = "CampusBazaar - Payment OTP (Resent)"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6366f1;">CampusBazaar Payment Verification</h2>
                <p>Hello {user_name},</p>
                <p>You have requested a new OTP for your payment of <strong>₹{amount:.2f}</strong> for Order #{order_id}.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Your OTP is:</p>
                    <h1 style="margin: 10px 0; font-size: 32px; color: #6366f1; letter-spacing: 5px;">{otp}</h1>
                    <p style="margin: 0; font-size: 12px; color: #999;">Valid for 5 minutes</p>
                </div>
                <p style="color: #666; font-size: 14px;">Please enter this OTP to complete your payment.</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this OTP, please ignore this email or contact support immediately.</p>
            </div>
        </body>
        </html>
        """
        
        send_email(registered_email, email_subject, email_body)
        
        return {
            "message": "OTP resent to your registered email",
            "email": registered_email,
            "expires_in": 300
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to resend OTP: {str(e)}")
    finally:
        cursor.close()
        conn.close()

