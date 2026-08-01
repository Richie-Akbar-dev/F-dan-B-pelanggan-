import qrcode
import qrcode.image.pil

url = "http://localhost:3000/pelanggan/meja/46"

qr = qrcode.QRCode(
    version=4,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=12,
    border=4,
)
qr.add_data(url)
qr.make(fit=True)

img = qr.make_image(fill_color="#1c1917", back_color="white")
img.save("/home/z/my-project/download/qr-meja-46.png", "PNG")
print(f"QR code saved for: {url}")
