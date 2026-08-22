"use client";

export default function PayrollPrintStyles() {
  return (
    <style jsx global>{`
    .payroll-print-title {
      @page {
        size: A4 portrait;
        margin: 5mm;
      }
  
      html,
  body {
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
  }
  
  .payroll-page {
    min-height: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }
  
  .payroll-page > :first-child {
    display: none !important;
  }
  
  .payroll-page > div {
    max-width: none !important;
    margin: 0 !important;
  }
  
  .payroll-page > div > :not(.payroll-employee-list) {
    display: none !important;
  }
  
  .payroll-employee-list {
    display: block !important;
    height: auto !important;
  }
  
  .payroll-employee-card {
    display: none !important;
  }
  
  .payroll-employee-card.payroll-print-target {
    display: block !important;
    position: static !important;
  }
  
  .payroll-print-batch-target {
    break-after: page;
    page-break-after: always;
  }
  
  .payroll-print-batch-target:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  
      body {
        background: #ffffff !important;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
  
      body * {
        visibility: hidden;
      }
  
      .payroll-print-target,
      .payroll-print-target * {
        visibility: visible;
      }
  
      .payroll-print-target {
        position: absolute !important;
        top: 0;
        left: 0;
        width: 100% !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        background: #ffffff !important;
      }
  
      .payroll-print-hide,
      .payroll-screen-header {
        display: none !important;
      }
  
      .payroll-print-title {
        display: block !important;
        margin-bottom: 8mm;
        text-align: center;
      }
  
      .payroll-print-title h1 {
        margin: 0 0 5mm;
        font-size: 20pt;
        letter-spacing: 0.15em;
      }
  
      .payroll-print-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 3mm;
        border-bottom: 2px solid #111827;
        font-size: 11pt;
      }
  
      .payroll-print-target > div {
        padding: 0 !important;
        border-top: none !important;
        background: #ffffff !important;
      }
  
      .payroll-print-target input,
      .payroll-print-target select,
      .payroll-print-target button {
        display: none !important;
      }
  
      .payroll-print-target [style*="grid"] {
        gap: 4mm !important;
      }
  
      .payroll-employee-card.payroll-breakdown-print-parent {
        display: block !important;
        position: static !important;
        overflow: visible !important;
      }
  
      .payroll-breakdown-print-parent
    > button {
    display: none !important;
  }
  
  .payroll-breakdown-print-parent
    > div {
    padding: 0 !important;
    border: none !important;
    background: #ffffff !important;
  }
  
  .payroll-page:not(.payroll-batch-both)
    .payroll-breakdown-print-parent
    > div
    > :not(.payroll-breakdown-print-target) {
    display: none !important;
  }
      
      .payroll-breakdown-print-target,
      .payroll-breakdown-print-target * {
        visibility: visible !important;
      }
      
      .payroll-breakdown-print-target {
        display: flex !important;
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 270mm !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
        align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
      }
      
      .payroll-breakdown-print-target > div {
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
      }
      
      .payroll-breakdown-print-target
        > div
        > div:first-child {
        position: static !important;
        margin-bottom: 3mm !important;
        padding-bottom: 2mm !important;
      }
      
      .payroll-breakdown-actions,
.payroll-breakdown-row-actions {
  display: none !important;
}

      .payroll-breakdown-edit-input {
        display: none !important;
      }
      
      .payroll-breakdown-print-value {
        display: inline !important;
        color: #111827 !important;
        font: inherit !important;
      }
      
      .payroll-breakdown-print-target table {
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        font-size: 6.5px !important;
        zoom: 1;
      }
      
      .payroll-breakdown-print-target th,
  .payroll-breakdown-print-target td {
    padding: 1px !important;
    line-height: 1.1 !important;
    white-space: normal !important;
    word-break: break-all !important;
    overflow: hidden !important;
    vertical-align: middle !important;
  }
  
  .payroll-breakdown-print-target thead tr {
    height: 24px !important;
  }
  
  .payroll-breakdown-print-target tbody tr {
    height: 20px !important;
  }
  
  .payroll-breakdown-print-target tfoot tr {
    height: 24px !important;
  }
  
  .payroll-breakdown-print-target
    tbody
    td:nth-child(1),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(2) {
    width: 4% !important;
  }
  
  .payroll-breakdown-print-target
    tbody
    td:nth-child(9),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(10),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(11),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(12),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(15),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(16),
  .payroll-breakdown-print-target
    tbody
    td:nth-child(17) {
    width: 3.5% !important;
  }
  
  .payroll-breakdown-batch-target {
    position: static !important;
    inset: auto !important;
  }
  
  .payroll-breakdown-batch-parent:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }
  
  .payroll-batch-both
    .payroll-breakdown-print-parent
    > div {
    display: flex !important;
    flex-direction: column !important;
  }
  
  .payroll-batch-both
    .payroll-breakdown-batch-target {
    order: 999;
    break-before: page;
    page-break-before: always;
  }
    }
    `}</style>
  );
}