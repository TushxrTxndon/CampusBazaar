from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from models.product_images import ProductImageCreate, ProductImageOut
from db import get_db
import mysql.connector
import uuid
import shutil
from pathlib import Path

router = APIRouter(prefix="/product-images", tags=["Product Images"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_product_image(file: UploadFile = File(...)):
    """Upload a product image and return the file path"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(400, "File must be an image")
        
        # Validate file size (max 5MB)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to start
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(400, "Image size must be less than 5MB")
        
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

@router.post("/add")
def add_product_image(image_data: ProductImageCreate):
    """Add an image to a product"""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Verify product exists
        cursor.execute("SELECT PID FROM Products WHERE PID = %s", (image_data.PID,))
        if not cursor.fetchone():
            raise HTTPException(404, "Product not found")

        # Get max display order for this product
        cursor.execute("""
            SELECT COALESCE(MAX(DisplayOrder), -1) + 1 as next_order
            FROM Product_Images
            WHERE PID = %s
        """, (image_data.PID,))
        result = cursor.fetchone()
        display_order = result[0] if result else 0

        cursor.execute("""
            INSERT INTO Product_Images (PID, ImageURL, DisplayOrder)
            VALUES (%s, %s, %s)
        """, (image_data.PID, image_data.ImageURL, display_order))

        conn.commit()
        image_id = cursor.lastrowid
        return {"message": "Image added", "ImageID": image_id}

    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.get("/product/{pid}")
def get_product_images(pid: str):
    """Get all images for a product"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT ImageID, PID, ImageURL, DisplayOrder
            FROM Product_Images
            WHERE PID = %s
            ORDER BY DisplayOrder, ImageID
        """, (pid,))
        results = cursor.fetchall()
        return results
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.delete("/{image_id}")
def delete_product_image(image_id: int):
    """Delete a product image"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get image info before deletion
        cursor.execute("""
            SELECT ImageURL FROM Product_Images WHERE ImageID = %s
        """, (image_id,))
        image = cursor.fetchone()

        if not image:
            raise HTTPException(404, "Image not found")

        # Delete from database
        cursor.execute("DELETE FROM Product_Images WHERE ImageID = %s", (image_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(404, "Image not found")

        conn.commit()

        # Delete file from filesystem
        try:
            image_path = Path(image["ImageURL"])
            if image_path.exists():
                image_path.unlink()
        except Exception as e:
            # Log error but don't fail the request
            print(f"Failed to delete image file: {e}")

        return {"message": "Image deleted successfully"}

    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

@router.put("/reorder")
def reorder_images(pid: str, image_orders: list):
    """Reorder product images
    Expects: [{"ImageID": 1, "DisplayOrder": 0}, ...]
    """
    conn = get_db()
    cursor = conn.cursor()

    try:
        for item in image_orders:
            cursor.execute("""
                UPDATE Product_Images
                SET DisplayOrder = %s
                WHERE ImageID = %s AND PID = %s
            """, (item["DisplayOrder"], item["ImageID"], pid))

        conn.commit()
        return {"message": "Images reordered successfully"}

    except mysql.connector.Error as err:
        raise HTTPException(400, str(err))
    finally:
        cursor.close()
        conn.close()

