import PDFDocument from 'pdfkit';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PayrollRecord } from '../models/PayrollRecord.entity';
import { Employee } from '../models/Employee.entity';
import { User } from '../models/User.entity';
import * as fs from 'fs';
import * as path from 'path';

export class SalarySlipService {
  private payrollRepository: Repository<PayrollRecord>;

  constructor() {
    this.payrollRepository = AppDataSource.getRepository(PayrollRecord);
  }

  async generateSalarySlip(payrollRecordId: string): Promise<string> {
    const payrollRecord = await this.payrollRepository.findOne({
      where: { id: payrollRecordId },
      relations: ['employee', 'employee.user'],
    });

    if (!payrollRecord) {
      throw new Error('Payroll record not found');
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'salary-slips');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `salary-slip-${payrollRecord.payroll_id}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    await this.createSalarySlipPDF(payrollRecord, filePath);

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const salarySlipUrl = `${baseUrl}/uploads/salary-slips/${filename}`;

    payrollRecord.salary_slip_url = salarySlipUrl;
    await this.payrollRepository.save(payrollRecord);

    return salarySlipUrl;
  }

  private async createSalarySlipPDF(payrollRecord: PayrollRecord, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        this.addHeader(doc, payrollRecord);
        this.addEmployeeDetails(doc, payrollRecord);
        this.addPayrollSummary(doc, payrollRecord);
        this.addEarningsSection(doc, payrollRecord);
        this.addDeductionsSection(doc, payrollRecord);
        this.addNetPaySection(doc, payrollRecord);
        this.addFooter(doc, payrollRecord);

        doc.end();

        stream.on('finish', () => {
          resolve();
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('TechFolks Private Limited', 50, 50)
       .fontSize(12)
       .font('Helvetica')
       .text('Competitive Coding Platform', 50, 75)
       .text('www.techfolks.com | hr@techfolks.com', 50, 90);

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('SALARY SLIP', 350, 50)
       .fontSize(12)
       .font('Helvetica')
       .text(`Payroll ID: ${payrollRecord.payroll_id}`, 350, 75)
       .text(`Date: ${new Date().toLocaleDateString()}`, 350, 90);

    doc.moveTo(50, 110)
       .lineTo(545, 110)
       .stroke();
  }

  private addEmployeeDetails(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    const yStart = 130;
    const employee = payrollRecord.employee;
    const user = employee.user;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Employee Details', 50, yStart);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Employee ID: ${employee.employee_id}`, 50, yStart + 25)
       .text(`Employee Name: ${user.full_name || user.username}`, 50, yStart + 40)
       .text(`Department: ${employee.department}`, 50, yStart + 55)
       .text(`Designation: ${employee.job_title}`, 50, yStart + 70)
       .text(`Employment Type: ${employee.employment_type}`, 50, yStart + 85);

    doc.text(`Pay Period: ${new Date(payrollRecord.pay_period_start).toLocaleDateString()} to ${new Date(payrollRecord.pay_period_end).toLocaleDateString()}`, 300, yStart + 25)
       .text(`Working Days: ${payrollRecord.working_days}`, 300, yStart + 40)
       .text(`Days Worked: ${payrollRecord.days_worked}`, 300, yStart + 55)
       .text(`Leave Days: ${payrollRecord.leave_days}`, 300, yStart + 70)
       .text(`Overtime Hours: ${payrollRecord.overtime_hours}`, 300, yStart + 85);

    doc.moveTo(50, yStart + 105)
       .lineTo(545, yStart + 105)
       .stroke();
  }

  private addPayrollSummary(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    const yStart = 260;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('PAYROLL SUMMARY', 50, yStart);

    doc.rect(50, yStart + 20, 445, 60)
       .stroke();

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Basic Salary', 60, yStart + 30)
       .text('Gross Salary', 200, yStart + 30)
       .text('Total Deductions', 320, yStart + 30)
       .text('Net Salary', 440, yStart + 30);

    doc.fontSize(11)
       .font('Helvetica')
       .text(`₹${payrollRecord.basic_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 60, yStart + 50)
       .text(`₹${payrollRecord.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, yStart + 50)
       .text(`₹${payrollRecord.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 320, yStart + 50);

    doc.font('Helvetica-Bold')
       .text(`₹${payrollRecord.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, yStart + 50);
  }

  private addEarningsSection(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    const yStart = 360;
    let currentY = yStart;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('EARNINGS', 50, currentY);

    currentY += 25;

    doc.rect(50, currentY, 220, 20)
       .stroke();

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Description', 60, currentY + 6)
       .text('Amount (₹)', 210, currentY + 6);

    currentY += 20;

    doc.fontSize(9)
       .font('Helvetica')
       .text('Basic Salary', 60, currentY + 5)
       .text(payrollRecord.basic_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, currentY + 5);

    currentY += 15;

    const earnings = payrollRecord.earnings;
    Object.keys(earnings).forEach(key => {
      if (key === 'custom_allowances' && Array.isArray(earnings[key])) {
        earnings[key].forEach((allowance: any) => {
          doc.text(allowance.name || key, 60, currentY + 5)
             .text(allowance.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, currentY + 5);
          currentY += 15;
        });
      } else if (typeof earnings[key] === 'number' && earnings[key] > 0) {
        const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(displayName, 60, currentY + 5)
           .text(earnings[key].toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, currentY + 5);
        currentY += 15;
      }
    });

    doc.rect(50, yStart + 20, 220, currentY - yStart - 20)
       .stroke();

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Total Earnings', 60, currentY + 5)
       .text(payrollRecord.gross_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 210, currentY + 5);

    doc.moveTo(60, currentY + 3)
       .lineTo(260, currentY + 3)
       .stroke();
  }

  private addDeductionsSection(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    const yStart = 360;
    let currentY = yStart;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('DEDUCTIONS', 325, currentY);

    currentY += 25;

    doc.rect(325, currentY, 220, 20)
       .stroke();

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Description', 335, currentY + 6)
       .text('Amount (₹)', 485, currentY + 6);

    currentY += 20;

    const deductions = payrollRecord.deductions;
    Object.keys(deductions).forEach(key => {
      if (key === 'custom_deductions' && Array.isArray(deductions[key])) {
        deductions[key].forEach((deduction: any) => {
          if (deduction.amount > 0) {
            doc.fontSize(9)
               .font('Helvetica')
               .text(deduction.name || key, 335, currentY + 5)
               .text(deduction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 485, currentY + 5);
            currentY += 15;
          }
        });
      } else if (typeof deductions[key] === 'number' && deductions[key] > 0) {
        const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.fontSize(9)
           .font('Helvetica')
           .text(displayName, 335, currentY + 5)
           .text(deductions[key].toLocaleString('en-IN', { minimumFractionDigits: 2 }), 485, currentY + 5);
        currentY += 15;
      }
    });

    doc.rect(325, yStart + 20, 220, currentY - yStart - 20)
       .stroke();

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Total Deductions', 335, currentY + 5)
       .text(payrollRecord.total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 485, currentY + 5);

    doc.moveTo(335, currentY + 3)
       .lineTo(535, currentY + 3)
       .stroke();
  }

  private addNetPaySection(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    const yPos = 600;

    doc.rect(50, yPos, 495, 40)
       .fill('#f8f9fa')
       .stroke();

    doc.fillColor('black')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('NET PAY', 60, yPos + 10)
       .text(`₹${payrollRecord.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, yPos + 10);

    const netPayInWords = this.convertNumberToWords(Math.floor(payrollRecord.net_salary));
    doc.fontSize(10)
       .font('Helvetica')
       .text(`In Words: ${netPayInWords} Rupees Only`, 60, yPos + 25);
  }

  private addFooter(doc: PDFKit.PDFDocument, payrollRecord: PayrollRecord): void {
    const yPos = 680;

    doc.fontSize(9)
       .font('Helvetica')
       .text('This is a computer-generated salary slip and does not require a signature.', 50, yPos)
       .text('For any queries, please contact HR at hr@techfolks.com', 50, yPos + 15)
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, yPos + 30)
       .text(`Status: ${payrollRecord.status.toUpperCase()}`, 350, yPos + 30);

    if (payrollRecord.notes) {
      doc.text(`Notes: ${payrollRecord.notes}`, 50, yPos + 45);
    }

    doc.moveTo(50, yPos - 10)
       .lineTo(545, yPos - 10)
       .stroke();
  }

  private convertNumberToWords(num: number): string {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    const convertHundreds = (n: number): string => {
      let result = '';
      
      if (n >= 100) {
        result += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 10 && n < 20) {
        result += teens[n - 10] + ' ';
      } else {
        if (n >= 20) {
          result += tens[Math.floor(n / 10)] + ' ';
          n %= 10;
        }
        if (n > 0) {
          result += units[n] + ' ';
        }
      }
      
      return result;
    };

    let result = '';
    let unitIndex = 0;

    while (num > 0) {
      const part = num % (unitIndex === 0 ? 1000 : unitIndex === 1 ? 100 : 1000);
      
      if (part > 0) {
        const partWords = convertHundreds(part);
        result = partWords + thousands[unitIndex] + ' ' + result;
      }
      
      num = Math.floor(num / (unitIndex === 0 ? 1000 : unitIndex === 1 ? 100 : 1000));
      unitIndex++;
    }

    return result.trim();
  }

  async batchGenerateSalarySlips(payrollRecordIds: string[]): Promise<string[]> {
    const urls: string[] = [];
    
    for (const recordId of payrollRecordIds) {
      try {
        const url = await this.generateSalarySlip(recordId);
        urls.push(url);
      } catch (error) {
        console.error(`Failed to generate salary slip for record ${recordId}:`, error);
      }
    }
    
    return urls;
  }

  async getSalarySlipUrl(payrollRecordId: string): Promise<string | null> {
    const payrollRecord = await this.payrollRepository.findOne({
      where: { id: payrollRecordId },
    });

    return payrollRecord?.salary_slip_url || null;
  }
}