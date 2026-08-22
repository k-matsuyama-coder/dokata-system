"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  BatchPrintMode,
} from "../payroll-types";

export default function usePayrollPrint(
  month: string
) {
  const [
    openEmployeeName,
    setOpenEmployeeName,
  ] = useState<string | null>(null);

  const [
    openBreakdownEmployeeName,
    setOpenBreakdownEmployeeName,
  ] = useState<string | null>(null);

  const [
    printEmployeeName,
    setPrintEmployeeName,
  ] = useState<string | null>(null);

  const [
    printBreakdownEmployeeName,
    setPrintBreakdownEmployeeName,
  ] = useState<string | null>(null);

  const [
    batchPrintMode,
    setBatchPrintMode,
  ] = useState<BatchPrintMode>("both");

  const [
    printAllBreakdowns,
    setPrintAllBreakdowns,
  ] = useState(false);

  const [
    printAllEmployees,
    setPrintAllEmployees,
  ] = useState(false);

  useEffect(() => {
    setOpenEmployeeName(null);
  }, [month]);

  const toggleEmployeeDetail = (
    employeeName: string
  ) => {
    setOpenEmployeeName((current) =>
      current === employeeName
        ? null
        : employeeName
    );
  };

  const printEmployeePayslip = (
    employeeName: string
  ) => {
    setPrintAllEmployees(false);
    setPrintAllBreakdowns(false);
    setPrintBreakdownEmployeeName(null);
    setOpenBreakdownEmployeeName(null);

    setOpenEmployeeName(employeeName);
    setPrintEmployeeName(employeeName);

    window.setTimeout(() => {
      window.print();
    }, 100);
  };

  const printAllPayrollDocuments = () => {
    setPrintEmployeeName(null);
    setPrintBreakdownEmployeeName(null);
    setOpenBreakdownEmployeeName(null);

    const shouldPrintPayslips =
      batchPrintMode === "both" ||
      batchPrintMode === "payslip";

    const shouldPrintBreakdowns =
      batchPrintMode === "both" ||
      batchPrintMode === "breakdown";

    setPrintAllEmployees(
      shouldPrintPayslips
    );

    setPrintAllBreakdowns(
      shouldPrintBreakdowns
    );

    window.setTimeout(() => {
      window.print();
    }, 500);
  };

  const printEmployeeBreakdown = (
    employeeName: string
  ) => {
    setPrintEmployeeName(null);
    setPrintAllEmployees(false);
    setPrintAllBreakdowns(false);

    setOpenBreakdownEmployeeName(
      employeeName
    );

    setPrintBreakdownEmployeeName(
      employeeName
    );

    window.setTimeout(() => {
      window.print();
    }, 200);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintEmployeeName(null);
      setPrintBreakdownEmployeeName(null);
      setPrintAllEmployees(false);
      setPrintAllBreakdowns(false);
    };

    window.addEventListener(
      "afterprint",
      handleAfterPrint
    );

    return () => {
      window.removeEventListener(
        "afterprint",
        handleAfterPrint
      );
    };
  }, []);

  return {
    openEmployeeName,
    openBreakdownEmployeeName,
    setOpenBreakdownEmployeeName,
    printEmployeeName,
    printBreakdownEmployeeName,
    batchPrintMode,
    setBatchPrintMode,
    printAllBreakdowns,
    printAllEmployees,
    toggleEmployeeDetail,
    printEmployeePayslip,
    printAllPayrollDocuments,
    printEmployeeBreakdown,
  };
}