from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from models.products import ProductCreate
from db import get_db
import mysql.connector
import uuid
import time
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/products", tags=["Products"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def generate_product_id():
    """Generate a unique product ID"""
    # Format: PROD + timestamp + short UUID
    timestamp = int(time.time() * 1000)  # milliseconds
    short_uuid = str(uuid.uuid4())[:8].upper()
    return f"PROD{timestamp}{short_uuid}"

@router.post("/add")
def add_product(product: ProductCreate):
    """Add a product to the Products table. Product ID is auto-generated if not provided."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Generate PID if not provided
        pid = product.PID if product.PID else generate_product_id()
        
        # Ensure PID is unique
        max_attempts = 5
        for attempt in range(max_attempts):
            cursor.execute("SELECT PID FROM Products WHERE PID = %s", (pid,))
            if cursor.fetchone():
                if attempt < max_attempts - 1:
                    pid = generate_product_id()
                else:
                    raise HTTPException(400, "Failed to generate unique product ID")
            else:
                break

        cursor.execute("""
            INSERT INTO Products (PID, ProductName, Description, Price)
            VALUES (%s, %s, %s, %s)
        """, (pid, product.ProductName, product.Description, product.Price))

        conn.commit()
        return {"message": "Product added", "PID": pid}

    except mysql.connector.IntegrityError as err:
        # Product already exists
        raise HTTPException(400, f"Product with PID {pid} already exists")
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def get_all_products(
    category_id: int = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    sort_by: str = Query("name"),  # name, price_asc, price_desc, newest
    search: str = Query(None)
):
    """Get all products with available stock information, filtering and sorting"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Build query with filters
        query = """
            SELECT p.PID, p.ProductName, p.Description, p.Price,
                   COALESCE(SUM(l.Stock), 0) as TotalStock,
                   COUNT(DISTINCT l.EmailID) as SellerCount,
                   (SELECT ImageURL FROM Product_Images 
                    WHERE PID = p.PID 
                    ORDER BY DisplayOrder, ImageID 
                    LIMIT 1) as PrimaryImage,
                   (SELECT AVG(Rating) FROM FeedBacks WHERE PID = p.PID) as AvgRating,
                   (SELECT COUNT(*) FROM FeedBacks WHERE PID = p.PID) as ReviewCount
            FROM Products p
            LEFT JOIN Lists l ON p.PID = l.PID
        """
        
        conditions = []
        params = []
        
        # Category filter
        if category_id:
            query += """
                INNER JOIN Product_Category pc ON p.PID = pc.PID
            """
            conditions.append("pc.CategoryID = %s")
            params.append(category_id)
        
        # Search filter
        if search:
            conditions.append("(p.ProductName LIKE %s OR p.Description LIKE %s)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        # Price filters
        if min_price is not None:
            conditions.append("p.Price >= %s")
            params.append(min_price)
        if max_price is not None:
            conditions.append("p.Price <= %s")
            params.append(max_price)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " GROUP BY p.PID, p.ProductName, p.Description, p.Price"
        
        # Sorting
        if sort_by == "price_asc":
            query += " ORDER BY p.Price ASC"
        elif sort_by == "price_desc":
            query += " ORDER BY p.Price DESC"
        elif sort_by == "newest":
            query += " ORDER BY p.PID DESC"  # Assuming newer products have higher IDs
        else:  # name
            query += " ORDER BY p.ProductName ASC"
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()


@router.get("/{pid}")
def get_product(pid: str):
    """Get product details with seller information and ratings"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get product with stock and rating info
        cursor.execute("""
            SELECT p.*,
                   COALESCE(SUM(l.Stock), 0) as TotalStock,
                   COUNT(DISTINCT l.EmailID) as SellerCount,
                   (SELECT AVG(Rating) FROM FeedBacks WHERE PID = p.PID) as AvgRating,
                   (SELECT COUNT(*) FROM FeedBacks WHERE PID = p.PID) as ReviewCount
            FROM Products p
            LEFT JOIN Lists l ON p.PID = l.PID
            WHERE p.PID = %s
            GROUP BY p.PID, p.ProductName, p.Description, p.Price
        """, (pid,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(404, "Product not found")

        # Get sellers for this product
        cursor.execute("""
            SELECT l.EmailID, u.FirstName, u.LastName, l.Stock
            FROM Lists l
            INNER JOIN Users u ON l.EmailID = u.EmailID
            WHERE l.PID = %s AND l.Stock > 0
        """, (pid,))
        sellers = cursor.fetchall()
        result["Sellers"] = sellers

        return result
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.post("/upload-image")
async def upload_product_image(file: UploadFile = File(...)):
    """Upload a product image and return the file path"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return relative path for storage in database
        image_url = f"uploads/products/{unique_filename}"
        return {"image_url": image_url, "message": "Image uploaded successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to upload image: {str(e)}")

@router.get("/images/{filename}")
async def get_product_image(filename: str):
    """Serve product images"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(404, "Image not found")
    return FileResponse(file_path)
