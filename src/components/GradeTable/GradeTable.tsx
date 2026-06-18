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
  // Thêm đoạn này vào bên trong component GradeTable, ngay trên lệnh return ()
React.useEffect(() => {
  let hasChanged = false;
  
  semesters.forEach((sem) => {
    // Kiểm tra xem mảng môn học hiện tại đã xếp đúng thứ tự A-Z chưa
    const currentOrder = sem.subjects.map(s => s.courseCode).join(",");
    const sortedOrder = [...sem.subjects]
      .sort((a, b) => (a.courseCode || "").toString().toUpperCase().localeCompare((b.courseCode || "").toString().toUpperCase()))
      .map(s => s.courseCode)
      .join(",");
      
    if (currentOrder !== sortedOrder) {
      sem.subjects.sort((a, b) => (a.courseCode || "").toString().toUpperCase().localeCompare((b.courseCode || "").toString().toUpperCase()));
      hasChanged = true;
    }
  });

  if (hasChanged) {
    setSemesters([...semesters]);
  }
}, [semesters, setSemesters]);
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
  {/* Nút thêm học kỳ ở ĐẦU BẢNG (Đã được bọc hàm ép chèn vào đầu bảng) */}
  <AddSemesterRow 
    semesters={semesters} 
    setSemesters={(updater) => {
      setSemesters((prevSemesters) => {
        // Lấy mảng dữ liệu mới sau khi nút gốc của SVUIT đã xử lý (học kỳ mới nằm ở cuối mảng)
        const updated = typeof updater === 'function' ? updater(prevSemesters) : updater;
        
        // Bốc học kỳ mới tinh ở cuối mảng ra
        const newSemester = updated[updated.length - 1];
        
        // Tạo một mảng sạch từ mảng cũ ban đầu
        const next = [...prevSemesters];
        
        // Dùng lệnh unshift để ép học kỳ mới này đứng vào VỊ TRÍ ĐẦU TIÊN (Index 0)
        next.unshift(newSemester);
        
        return next;
      });
    }} 
  />

  {/* KHÔI PHỤC ĐOẠN NÀY: Duyệt mảng semesters trực tiếp không qua sort trung gian */}
  {semesters.map((sem, si) => (
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
      
      {/* 2. Nút thêm học kỳ ở GIỮA BẢNG (Đã được bọc hàm chèn đúng vị trí) */}
{si < semesters.length - 1 && (
  <AddSemesterRow 
    semesters={semesters} 
    setSemesters={(updater) => {
      // Hàm này "đánh lừa" nút bấm của SVUIT
      setSemesters((prevSemesters) => {
        // Lấy mảng semesters mới mà component AddSemesterRow vừa tạo ra (môn mới nằm ở cuối mảng)
        const updated = typeof updater === 'function' ? updater(prevSemesters) : updater;
        
        // Bốc cái học kỳ mới tinh bị ném ở cuối mảng đó ra...
        const newSemester = updated[updated.length - 1];
        
        // ... tạo một mảng sạch từ mảng cũ ban đầu
        const next = [...prevSemesters];
        
        // ... rồi dùng lệnh splice để chèn chính xác vào ngay sau học kỳ hiện tại (vị trí si + 1)
        next.splice(si + 1, 0, newSemester);
        
        return next;
      });
    }} 
  />
)}
    </React.Fragment>
  ))}

  {/* Nút thêm học kỳ ở CUỐI BẢNG */}
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
