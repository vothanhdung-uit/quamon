import { NextApiRequest, NextApiResponse } from 'next';

export const dynamic = 'force-dynamic';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 1. Nhận dữ liệu môn học được gửi từ Form trên giao diện web
    const { courseCode, courseNameVi, credits, defaultWeights, category } = req.body;

    if (!courseCode || !courseNameVi || !credits) {
      return res.status(400).json({ message: 'Thiếu thông tin môn học bắt buộc!' });
    }

    // Định dạng môn học mới theo chuẩn cấu hình của SVUIT
    const newSubjectData = {
      courseCode: courseCode.trim().toUpperCase(),
      courseNameVi: courseNameVi.trim(),
      credits: parseInt(credits, 10) || 3,
      defaultWeights: defaultWeights || {
        progressWeight: 0.2,
        practiceWeight: 0.2,
        midtermWeight: 0.2,
        finalTermWeight: 0.4
      }
    };

    // Xác định phân loại học phần (Mặc định cho vào "Khác" nếu form không gửi lên)
    const targetCategory = category || "Khác";

    // 2. Lấy thông tin cấu hình từ biến môi trường Vercel
    const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
    const OWNER = 'vothanhdung-uit'; 
    const REPO = 'quamon';
    const FILE_PATH = 'src/constants.ts'; // Đường dẫn file dữ liệu gốc của SVUIT

    if (!GITHUB_TOKEN) {
      return res.status(500).json({ message: 'Chưa cấu hình biến MY_GITHUB_TOKEN trên Vercel!' });
    }

    // 3. Gọi GitHub API để lấy file constants.ts hiện tại về
    const getFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });

    if (!getFileRes.ok) {
      return res.status(500).json({ message: 'Không thể kết nối lấy file từ GitHub. Kiểm tra lại Repo name hoặc Token.' });
    }

    const fileData = await getFileRes.json();
    const oldContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;

    // 4. XỬ LÝ CHÈN MÔN HỌC HOÀN CHỈNH BẰNG REGEX VÀ PARSE OBJECT
    // Tìm đoạn chứa đối tượng SUBJECTS_DATA trong file constants.ts
    const match = oldContent.match(/export\s+const\s+SUBJECTS_DATA\s*:\s*Record<string,\s*any>|any\[\]\s*=\s*([\s\S]*?);/);
    
    let updatedContent = "";

    if (match) {
      // Tìm vị trí của dấu ngoặc nhọn đầu tiên sau biến SUBJECTS_DATA
      const startIndex = oldContent.indexOf('{', oldContent.indexOf('SUBJECTS_DATA'));
      // Tìm vị trí dấu kết thúc của Object (dấu nhọn cuối cùng trước dấu chấm phẩy)
      const endIndex = oldContent.indexOf('};', startIndex) + 1;
      
      const objectText = oldContent.substring(startIndex, endIndex);
      
      // Chuyển chuỗi text Object thành Object thực tế trong JS để xử lý an toàn
      // Sử dụng hàm Eval an toàn vì đây là môi trường backend nội bộ của bạn
      let subjectsObj: Record<string, any> = {};
      try {
        subjectsObj = new Function(`return ${objectText};`)();
      } catch (e) {
        // Dự phòng nếu cấu trúc file là mảng phẳng thay vì Object phân loại
        subjectsObj = {};
      }

      // Nếu nhóm học phần (ví dụ: "Khoa học máy tính") chưa tồn tại, tự tạo mảng mới
      if (!subjectsObj[targetCategory]) {
        subjectsObj[targetCategory] = [];
      }

      // Kiểm tra trùng mã môn, nếu chưa trùng thì mới chèn vào đầu mảng của Nhóm đó
      const isExist = subjectsObj[targetCategory].some((item: any) => item.courseCode === newSubjectData.courseCode);
      if (!isExist) {
        subjectsObj[targetCategory].unshift(newSubjectData);
      } else {
        return res.status(200).json({ success: true, message: 'Môn học này đã tồn tại sẵn trong hệ thống rồi!' });
      }

      // Khôi phục lại Object thành chuỗi string định dạng đẹp đẽ
      const newObjectText = JSON.stringify(subjectsObj, null, 2);
      
      // Ghép chuỗi Object mới đè vào vị trí chuỗi Object cũ trong file constants.ts
      updatedContent = oldContent.substring(0, startIndex) + newObjectText + oldContent.substring(endIndex);
    } else {
      // Trường hợp dự phòng nếu cấu trúc file constants.ts của SVUIT chỉ là mảng phẳng dạng `export const SUBJECTS_DATA = [...]`
      const arrayStartIndex = oldContent.indexOf('[', oldContent.indexOf('SUBJECTS_DATA'));
      if (arrayStartIndex !== -1) {
        updatedContent = oldContent.replace(
          'export const SUBJECTS_DATA = [',
          `export const SUBJECTS_DATA = [\n  ${JSON.stringify(newSubjectData, null, 2)},`
        );
      } else {
        throw new Error("Không thể phân tích cấu trúc file constants.ts của SVUIT.");
      }
    }

    // 5. Đẩy (Commit) nội dung file mới vừa cập nhật đè thẳng lên GitHub cá nhân của bạn
    const updateFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `feat: Tự động thêm môn ${newSubjectData.courseNameVi} (${newSubjectData.courseCode}) qua giao diện Web`,
        content: Buffer.from(updatedContent, 'utf-8').toString('base64'),
        sha: fileSha, // Đưa SHA vào để xác thực ghi đè hợp lệ
        branch: 'main' // Đẩy thẳng vào nhánh chính để Vercel bắt được lệnh build
      })
    });

    if (updateFileRes.ok) {
      return res.status(200).json({ success: true, message: 'Đã lưu môn học vĩnh viễn vào Repo cá nhân thành công!' });
    } else {
      const errorData = await updateFileRes.json();
      return res.status(500).json({ error: errorData, message: 'Lỗi khi đẩy file lên GitHub.' });
    }

  } catch (error: any) {
    return res.status(500).json({ error: error.message, message: 'Đã xảy ra sự cố xử lý hệ thống.' });
  }
}
