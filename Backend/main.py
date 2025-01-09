from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware  
import os
import shutil
from fpdf import FPDF
import subprocess
import zipfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {'doc', 'docx', 'ppt', 'pptx', 'vcf'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_vcf_to_pdf(vcf_path):
    pdf_path = os.path.splitext(vcf_path)[0] + '.pdf'

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    with open(vcf_path, 'r', encoding='utf-8') as vcf_file:
        for line in vcf_file:
            pdf.cell(200, 10, txt=line.strip(), ln=True)

    pdf.output(pdf_path)

    return pdf_path

def convert_to_pdf(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError("File does not exist")

    if not allowed_file(file_path):
        raise ValueError("Invalid file type")

    file_extension = file_path.rsplit('.', 1)[1].lower()

    if file_extension in {'doc', 'docx', 'ppt', 'pptx'}:
        subprocess.run(
            ["libreoffice", "--headless", "--convert-to", "pdf", file_path, "--outdir", os.path.dirname(file_path)],
            check=True  
        )

        pdf_path = os.path.splitext(file_path)[0] + '.pdf'

        if not os.path.exists(pdf_path):
            raise FileNotFoundError("Conversion to PDF failed")

        return pdf_path

    elif file_extension == 'vcf':
        return convert_vcf_to_pdf(file_path)

    else:
        raise ValueError("Unsupported file format")

def create_zip(pdf_files):
    zip_file_path = "converted_files.zip"
    with zipfile.ZipFile(zip_file_path, 'w') as zipf:
        for file in pdf_files:
            zipf.write(file, os.path.basename(file))  
    return zip_file_path


@app.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    try:
        pdf_files = []

        for file in files:
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            pdf_file_path = convert_to_pdf(file_path)
            pdf_files.append(pdf_file_path)

        if len(pdf_files) == 1:
            return FileResponse(pdf_files[0], media_type='application/pdf', filename="converted.pdf")

        zip_file_path = create_zip(pdf_files)
        return FileResponse(zip_file_path, media_type='application/zip', filename="converted_files.zip")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app',host = '0.0.0.0',port = 8000,reload=True)
    