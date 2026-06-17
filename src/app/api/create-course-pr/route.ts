import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Nhận dữ liệu JSON từ giao diện gửi lên
    const body = await req.json();
    const { courseCode, courseNameVi, courseNameEn, courseType, credits, defaultWeights, description } = body;

    if (!courseCode || !courseNameVi || !credits) {
      return NextResponse.json({ message: 'Thiếu thông tin môn học bắt buộc!' }, { status: 400 });
    }

    // 2. Định dạng cấu trúc môn học mới khít 100% với file courses_weighted.json của SVUIT
    const newSubjectData = {
      courseCode: courseCode.trim().toUpperCase(),
      courseNameEn: courseNameEn ? courseNameEn.trim() : "",
      courseNameVi: courseNameVi.trim(),
      courseType: courseType || "ĐC",
      credits: parseInt(credits, 10) || 3,
      defaultWeights: defaultWeights || {
        progressWeight: 0.2,
        practiceWeight: 0.2,
        midtermWeight: 0.2,
        finalTermWeight: 0.4
      },
      description: description ? description.trim() : ""
    };

    // 3. Cấu hình đường dẫn chính xác tới file JSON trên GitHub cá nhân của bạn
    const GITHUB_TOKEN = process.env.MY_GITHUB_TOKEN;
    const OWNER = 'vothanhdung-uit'; 
    const REPO = 'quamon';
    const FILE_PATH = 'src/assets/courses_weighted.json'; // Đã sửa đường dẫn chuẩn theo SVUIT

    if (!GITHUB_TOKEN) {
      return NextResponse.json({ message: 'Chưa cấu hình biến MY_GITHUB_TOKEN trên Vercel!' }, { status: 500 });
    }

    // 4. Gọi GitHub API để lấy nội dung file JSON hiện tại về
    const getFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
      cache: 'no-store'
    });

    if (!getFileRes.ok) {
      return NextResponse.json({ message: 'Không thể lấy file JSON từ GitHub. Kiểm tra lại Repo hoặc Token.' }, { status: 500 });
    }

    const fileData = await getFileRes.json();
    const oldContentStr = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const fileSha = fileData.sha;

    // 5. XỬ LÝ MẢNG JSON (Cực kỳ an toàn, không lo lỗi cú pháp)
    let coursesArray: any[] = [];
    try {
      coursesArray = JSON.parse(oldContentStr);
      if (!Array.isArray(coursesArray)) {
        coursesArray = [];
      }
    } catch (e) {
      coursesArray = [];
    }

    // Kiểm tra trùng mã môn học để tránh chèn lặp dữ liệu
    const isExist = coursesArray.some((item: any) => item.courseCode === newSubjectData.courseCode);
    if (!isExist) {
      // Chèn môn học mới lên đầu danh sách mảng JSON
      coursesArray.unshift(newSubjectData);
    } else {
      return NextResponse.json({ success: true, message: 'Môn học này đã tồn tại sẵn trong file hệ thống của bạn rồi!' });
    }

    // Chuyển mảng Object ngược lại thành chuỗi string JSON định dạng đẹp
    const updatedContentStr = JSON.stringify(coursesArray, null, 2);

    // 6. Đẩy (Commit) nội dung JSON mới đè thẳng lên GitHub cá nhân của bạn
    const updateFileRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `feat: Tự động thêm môn ${newSubjectData.courseNameVi} (${newSubjectData.courseCode}) vào file JSON`,
        content: Buffer.from(updatedContentStr, 'utf-8').toString('base64'),
        sha: fileSha, // Truyền SHA cũ để được quyền ghi đè hợp lệ
        branch: 'main'
      })
    });

    if (updateFileRes.ok) {
      return NextResponse.json({ success: true, message: 'Đã lưu môn học vĩnh viễn vào file JSON thành công!' });
    } else {
      const errorData = await updateFileRes.json();
      return NextResponse.json({ error: errorData, message: 'Lỗi khi đẩy file JSON lên GitHub.' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message, message: 'Đã xảy ra sự cố xử lý hệ thống.' }, { status: 500 });
  }
}
