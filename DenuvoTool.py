import os
import glob
import time
import tkinter as tk
from tkinter import filedialog, messagebox

def browse_folder():
    """Hàm mở hộp thoại chọn thư mục game"""
    folder_path = filedialog.askdirectory(title="Chọn đường dẫn game")
    if folder_path:
        entry_path.delete(0, tk.END)
        entry_path.insert(0, folder_path)

def run_game_and_extract():
    """Hàm chạy FC26.exe, đợi sinh file và trích xuất dòng 3"""
    game_dir = entry_path.get()
    
    if not game_dir or not os.path.isdir(game_dir):
        messagebox.showerror("Lỗi", "Vui lòng chọn đúng đường dẫn thư mục game!")
        return

    # 1. Tìm đường dẫn file FC26.exe
    exe_path = os.path.join(game_dir, "FC26.exe")
    if not os.path.exists(exe_path):
        messagebox.showerror("Lỗi", "Không tìm thấy file FC26.exe trong thư mục đã chọn!")
        return

    # Lưu lại thời gian hiện tại để so sánh (chỉ lấy file được tạo SAU khi nhấn nút)
    start_time = time.time()

    # 2. Tự động chạy file FC26.exe
    try:
        os.startfile(exe_path)
        lbl_status.config(text="Đang chạy FC26.exe và đợi sinh file...", fg="blue")
        root.update()
    except Exception as e:
        messagebox.showerror("Lỗi", f"Không thể khởi chạy FC26.exe: {str(e)}")
        return

    # 3. Chờ file Denuvo_ticket được sinh ra (timeout tối đa 15 giây)
    timeout = 15
    new_ticket_file = None
    
    for _ in range(timeout):
        time.sleep(1) # Nghỉ 1 giây rồi quét lại
        root.update() # Giữ cho giao diện không bị đơ
        
        search_pattern = os.path.join(game_dir, "Denuvo_ticket_*.txt")
        ticket_files = glob.glob(search_pattern)
        
        if ticket_files:
            # Lấy file có thời gian tạo mới nhất
            latest_file = max(ticket_files, key=os.path.getctime)
            
            # Kiểm tra nếu file này vừa được tạo ra sau khi ta chạy exe
            if os.path.getctime(latest_file) >= start_time:
                new_ticket_file = latest_file
                break

    if not new_ticket_file:
        lbl_status.config(text="Lỗi: Quá thời gian chờ!", fg="red")
        messagebox.showerror("Lỗi", "Đã đợi 15 giây nhưng không thấy file Denuvo_ticket nào được sinh ra. Hãy kiểm tra lại game.")
        return

    # 4. Đọc file và nạp dòng thứ 3 vào Clipboard
    try:
        with open(new_ticket_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Xóa các khoảng trắng/dòng trống thừa
        valid_lines = [line.strip() for line in lines if line.strip()]

        if len(valid_lines) >= 3:
            token_code = valid_lines[2] # Lấy dòng thứ 3 (index 2)
            
            # Copy vào bộ nhớ tạm
            root.clipboard_clear()
            root.clipboard_append(token_code)
            root.update()

            lbl_status.config(text="Thành công! Đã lưu mã vào Clipboard.", fg="green")
            messagebox.showinfo("Thành công", f"Đã tự động chạy game và copy mã từ file:\n{os.path.basename(new_ticket_file)}\n\nBây giờ bạn có thể Paste (Ctrl+V) mã token.")
        else:
            lbl_status.config(text="Lỗi: Cấu trúc file sai", fg="red")
            messagebox.showwarning("Cảnh báo", "File sinh ra không đủ 3 dòng dữ liệu. Vui lòng kiểm tra lại cấu trúc file.")
            
    except Exception as e:
        lbl_status.config(text="Lỗi đọc file", fg="red")
        messagebox.showerror("Lỗi", f"Có lỗi xảy ra khi đọc file: {str(e)}")

# --- THIẾT KẾ GIAO DIỆN (UI) ---
root = tk.Tk()
root.title("Tool Auto Denuvo Token FC 26")
root.geometry("500x200")
root.resizable(False, False)

# Label hướng dẫn
lbl_instruction = tk.Label(root, text="Bước 1: Chọn đường dẫn đến thư mục game FC 26", font=("Arial", 10))
lbl_instruction.pack(pady=(10, 5))

# Frame chứa thanh chọn đường dẫn
frame_path = tk.Frame(root)
frame_path.pack(fill=tk.X, padx=20)

entry_path = tk.Entry(frame_path, font=("Arial", 10))
entry_path.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

btn_browse = tk.Button(frame_path, text="Chọn Thư Mục", command=browse_folder)
btn_browse.pack(side=tk.RIGHT)

# Nút Chạy & Trích xuất
btn_install = tk.Button(root, text="Chạy Game & Trích Xuất Token", font=("Arial", 10, "bold"), bg="#4CAF50", fg="white", command=run_game_and_extract)
btn_install.pack(pady=15, ipadx=10, ipady=5)

# Label trạng thái để người dùng biết tool đang làm gì
lbl_status = tk.Label(root, text="Sẵn sàng.", font=("Arial", 9, "italic"), fg="gray")
lbl_status.pack()

# Chạy vòng lặp giao diện
root.mainloop()