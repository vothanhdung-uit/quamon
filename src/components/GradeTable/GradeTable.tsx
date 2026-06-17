import React from "react";
import type { Semester, Course, GpaScale } from "../../types";
import SemesterBlock from "./SemesterBlock";
import AddSemesterRow from "./AddSemesterRow";
import SummaryRows from "./SummaryRows";
import GpaScaleSelector from "../GpaScaleSelector/GpaScaleSelector";

interface GradeTableProps {
  semesters: Semester[];
  setSemesters: (semesters: Semester[] | ((prev: Semester[]) => Semester[])) => void;
  cumulativeExpected: string;
  setCumulativeExpected: (value: string) => void;
  isCumulativeManual: boolean;
  setIsCumulativeManual: (value: boolean) => void;
  gpaScale: GpaScale;
  setGpaScale: (scale: GpaScale) => void;
  updateSubjectField: (s: number, i: number, f: string, v: string) => void;
  updateSubjectExpectedScore: (s: number, i: number, v: string) => void; 
  deleteSemester: (id: string) => void;
  deleteSubject: (s: number, i: number) => void;
  openAdvancedModal: (s: number, i: number) => void;

  openMenu: { s: number; i: number } | null;
  setOpenMenu: (val: { s: number; i: number } | null) => void;

  semesterMenuOpen?: number | null;
  setSemesterMenuOpen?: (val: number | null) => void;

  addDropdownOpen: number | null;
  setAddDropdownOpen: (val: number | null) => void;
  addSearchTerm: string;
  setAddSearchTerm: (term: string) => void;
  addSearchResults: { category: string; subjects: Course[] }[];
  addExpandedCategories: Set<string>;
  setAddExpandedCategories: (cats: Set<string>) => void;

  editDropdownOpen: { s: number; i: number; field: string } | null;
  setEditDropdownOpen: (
    val: { s: number; i: number; field: string } | null
  ) => void;
  editSearchTerm: string;
  setEditSearchTerm: (term: string) => void;
  editSearchResults: { category: string; subjects: Course[] }[];
  editExpandedCategories: Set<string>;
  setEditExpandedCategories: (cats: Set<string>) => void;
}

const GradeTable: React.FC<GradeTableProps> = ({
  semesters,
  setSemesters,
  cumulativeExpected,
  setCumulativeExpected,
  isCumulativeManual,
  setIsCumulativeManual,
  gpaScale,
  setGpaScale,
  updateSubjectField,
  updateSubjectExpectedScore, 
  deleteSemester,
  deleteSubject,
  openAdvancedModal,
  openMenu,
  setOpenMenu,
  semesterMenuOpen,
  setSemesterMenuOpen,
  addDropdownOpen,
  setAddDropdownOpen,
  addSearchTerm,
  setAddSearchTerm,
  addSearchResults,
  addExpandedCategories,
  setAddExpandedCategories,
  editDropdownOpen,
  setEditDropdownOpen,
  editSearchTerm,
  setEditSearchTerm,
  editSearchResults,
  editExpandedCategories,
  setEditExpandedCategories,
}) => {
  const handleApplyExpectedOverall = (updatedSemesters: Semester[]) => {
    setSemesters(updatedSemesters);
  };
// --- CHÈN ĐOẠN CODE NÀY VÀO NGAY ĐÂY ---
const handleInsertSemester = (index: number) => {
  setSemesters((prevSemesters) => {
    const next = [...prevSemesters];
    // Tạo cấu trúc học kỳ mới
    const newSemester: Semester = {
      id: `sem-${self.crypto.randomUUID()}`,
      name: `Học kỳ ${next.length + 1} (Bổ sung)`,
      subjects: [],
      expectedAverage: "",
      isExpectedAverageManual: false,
    };
    
    // Sử dụng splice để chèn học kỳ vào đúng vị trí chỉ định (sau vị trí index)
    next.splice(index + 1, 0, newSemester);
    return next;
  });
};
// ----------------------------------------
  return (
    <>
      {/* GPA Scale Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '0 8px'
      }}>
        <GpaScaleSelector 
          currentScale={gpaScale} 
          onScaleChange={setGpaScale}
        />
      </div>
      
      <table className="grade-table">
      {/* Column definitions */}
      <colgroup>
        <col className="col-stt" />
        <col className="col-mahp" />
        <col className="col-tenhp" />
        <col className="col-tc" />
        <col className="col-score" />
        <col className="col-score" />
        <col className="col-score" />
        <col className="col-score" />
        <col className="col-diemhp" />
        <col className="col-expected" />
      </colgroup>

      <thead>
        <tr>
          <th>STT</th>
          <th>Mã HP</th>
          <th>Tên HP</th>
          <th>TC</th>
          <th>QT</th>
          <th>GK</th>
          <th>TH</th>
          <th>CK</th>
          <th>Điểm HP</th>
          <th>Điểm kỳ vọng</th>
        </tr>
      </thead>

      <tbody>
  {semesters.map((sem) => {
    // Logic sort A-Z mã môn giữ nguyên của câu trước
    const sortedSubjects = [...sem.subjects].sort((a: any, b: any) => {
      const codeA = (a.courseCode || "").toString().toUpperCase();
      const codeB = (b.courseCode || "").toString().toUpperCase();
      return codeA.localeCompare(codeB, 'en', { sensitivity: 'base' });
    });
    return { ...sem, subjects: sortedSubjects };
  }).map((sem, si) => (
    <React.Fragment key={sem.id || `sem-${si}`}>
      <SemesterBlock
        semester={sem}
        semesterIndex={si}
        semesters={semesters}
        setSemesters={setSemesters}
        gpaScale={gpaScale}
        updateSubjectField={updateSubjectField}
        updateSubjectExpectedScore={updateSubjectExpectedScore} 
        deleteSemester={deleteSemester}
        deleteSubject={deleteSubject}
        openAdvancedModal={openAdvancedModal}
        semesterMenuOpen={semesterMenuOpen}
        setSemesterMenuOpen={setSemesterMenuOpen}
        addDropdownOpen={addDropdownOpen}
        setAddDropdownOpen={setAddDropdownOpen}
        addSearchTerm={addSearchTerm}
        setAddSearchTerm={setAddSearchTerm}
        addSearchResults={addSearchResults}
        addExpandedCategories={addExpandedCategories}
        setAddExpandedCategories={setAddExpandedCategories}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        editDropdownOpen={editDropdownOpen}
        setEditDropdownOpen={setEditDropdownOpen}
        editSearchTerm={editSearchTerm}
        setEditSearchTerm={setEditSearchTerm}
        editSearchResults={editSearchResults}
        editExpandedCategories={editExpandedCategories}
        setEditExpandedCategories={setEditExpandedCategories}
      />
      
      {/* Thêm một hàng nút bấm nhỏ xen kẽ giữa các học kỳ */}
      <tr>
        <td colSpan={10} style={{ padding: '4px 0', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => handleInsertSemester(si)}
            style={{
              padding: "4px 12px",
              fontSize: "11px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              color: "#6366f1",
              border: "1px dashed #6366f1",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#6366f1";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.color = "#6366f1";
            }}
          >
            + Chèn học kỳ mới vào đây
          </button>
        </td>
      </tr>
    </React.Fragment>
  ))}

  <AddSemesterRow semesters={semesters} setSemesters={setSemesters} />
  <SummaryRows 
    semesters={semesters}
    cumulativeExpected={cumulativeExpected}
    onApplyExpectedOverall={handleApplyExpectedOverall}
    onSetCumulativeExpected={setCumulativeExpected}
    isCumulativeManual={isCumulativeManual}
    setIsCumulativeManual={setIsCumulativeManual}
    gpaScale={gpaScale}
  />
</tbody>
    </table>
    </>
  );
};

export default GradeTable;
