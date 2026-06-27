type MemberEntry = {
    name: string;
    labor: string;
    overtime: string;
  };
  
  type Props = {
    reportDate: string;
    contractorName: string;
    site: string;
    work: string;
    startTime: string;
    endTime: string;
    shiftType: string;
    selectedMembers: MemberEntry[];
    assignmentMembers: string[];
    membersConfirmed: boolean;
    isSubmitting: boolean;
    setIsSubmitting: (value: boolean) => void;
    onSubmit: () => void | Promise<void>;
  };
  
  export function useReportValidation({
    reportDate,
    contractorName,
    site,
    work,
    startTime,
    endTime,
    shiftType,
    selectedMembers,
    assignmentMembers,
    membersConfirmed,
    isSubmitting,
    setIsSubmitting,
    onSubmit,
  }: Props) {
    const validate = () => {
      if (!reportDate) return "日付を入力してください";
      if (!contractorName) return "元請を入力してください";
      if (!site) return "現場名を入力してください";
      if (!work) return "作業内容を入力してください";
      if (!startTime) return "開始時間を選択してください";
      if (!endTime) return "終了時間を選択してください";
      if (selectedMembers.length === 0) return "メンバーを追加してください";
  
      if (assignmentMembers.length > 0 && !membersConfirmed) {
        return "番割メンバーを確認してください";
      }
  
      if (startTime === endTime) {
        return "開始時間と終了時間が同じです";
      }
  
      return null;
    };
  
    const handleValidatedSubmit = async () => {
      if (isSubmitting) return;
  
      const errorMessage = validate();
  
      if (errorMessage) {
        alert(errorMessage);
        return;
      }
  
      const startHour = Number(startTime.split(":")[0]);
      const endHour = Number(endTime.split(":")[0]);
  
      if (
        shiftType === "day" &&
        (startHour >= 20 || endHour >= 20 || startHour <= 4 || endHour <= 4)
      ) {
        const ok = window.confirm(
          "昼勤務になっていますが、時間が夜勤帯に見えます。このまま保存しますか？"
        );
        if (!ok) return;
      }
  
      if (
        shiftType === "night" &&
        startHour >= 6 &&
        startHour <= 17 &&
        endHour >= 6 &&
        endHour <= 17
      ) {
        const ok = window.confirm(
          "夜勤務になっていますが、時間が昼勤帯に見えます。このまま保存しますか？"
        );
        if (!ok) return;
      }
  
      setIsSubmitting(true);
  
      try {
        await onSubmit();
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return {
      handleValidatedSubmit,
    };
  }