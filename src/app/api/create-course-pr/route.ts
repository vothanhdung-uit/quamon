import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Nhận dữ liệu JSON từ Form gửi lên (Chuẩn App Router)
    const body = await req.json();
    const { courseCode, courseNameVi, credits, defaultWeights, category } = body;

    if (!courseCode || !courseNameVi || !credits) {
      return NextResponse.json({ message: 'Thiếu thông tin môn học bắt buộc!' }, { status: 400 });
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

    // Xác định phân loại học phần
    const targetCategory = category || "Khác";

    // 2. Lấy thông tin cấu hình từ biến môi trường Vercel
    const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
    const OWNER = 'vothanhdung-uit'; 
    const REPO = 'quamon';
    const FILE_PATH = 'src/constants.ts'; 

    if (!GITHUB_TOKEN) {
      return NextResponse.json({ message: 'Chưa cấu hình biến MY_GITHUB_TOKEN trên Vercel!' }, { status: 500 });
    }

    // 3. Gọi GitHub API để lấy file constants.ts hiện tại về
    const getFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
      cache: 'no-store'
    });

    if (!getFileRes.ok) {
      return NextResponse.json({ message: 'Không thể kết nối lấy file từ GitHub. Kiểm tra lại Repo name hoặc Token.' }, { status: 500 });
    }

    const fileData = await getFileRes.json();
    const oldContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;

    // 4. XỬ LÝ CHÈN MÔN HỌC BẰNG REGEX VÀ PARSE OBJECT
    const match = oldContent.match(/export\s+const\s+SUBJECTS_DATA\s*:\s*Record<string,\s*any>|any\[\]\s*=\s*([\s\S]*?);/);
    
    let updatedContent = "";

    if (match) {
      const startIndex = oldContent.indexOf('{', oldContent.indexOf('SUBJECTS_DATA'));
      const endIndex = oldContent.indexOf('};', startIndex) + 1;
      const objectText = oldContent.substring(startIndex, endIndex);
      
      let subjectsObj: Record<string, any> = {};
      try {
        subjectsObj = new Function(`return ${objectText};`)();
      } catch (e) {
        subjectsObj = {};
      }

      if (!subjectsObj[targetCategory]) {
        subjectsObj[targetCategory] = [];
      }

      const isExist = subjectsObj[targetCategory].some((item: any) => item.courseCode === newSubjectData.courseCode);
      if (!isExist) {
        subjectsObj[targetCategory].unshift(newSubjectData);
      } else {
        return NextResponse.json({ success: true, message: 'Môn học này đã tồn tại sẵn trong hệ thống rồi!' });
      }

      const newObjectText = JSON.stringify(subjectsObj, null, 2);
      updatedContent = oldContent.substring(0, startIndex) + newObjectText + oldContent.substring(endIndex);
    } else {
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

    // 5. Đẩy (Commit) nội dung file mới đè thẳng lên GitHub cá nhân của bạn
    const updateFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `feat: Tự động thêm môn ${newSubjectData.courseNameVi} (${newSubjectData.courseCode}) qua giao diện Web`,
        content: Buffer.from(updatedContent, 'utf-8').toString('base64'),
        sha: fileSha,
        branch: 'main'
      })
    });

    if (updateFileRes.ok) {
      return NextResponse.json({ success: true, message: 'Đã lưu môn học vĩnh viễn vào Repo cá nhân thành công!' });
    } else {
      const errorData = await updateFileRes.json();
      return NextResponse.json({ error: errorData, message: 'Lỗi khi đẩy file lên GitHub.' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message, message: 'Đã xảy ra sự cố xử lý hệ thống.' }, { status: 500 });
  }
}
