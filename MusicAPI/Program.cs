using Microsoft.EntityFrameworkCore;
using MusicAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// --- THÊM ĐOẠN NÀY ĐỂ KẾT NỐI DATABASE SQLITE ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=music.db"));

// Mở khóa CORS cho mọi nguồn truy cập (để sau này đưa lên mạng không bị lỗi)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // Lệnh thần thánh: Nếu chưa có bảng thì tự tạo cho con!
}

// Kích hoạt CORS (Phải nằm trên MapControllers)
app.UseCors("AllowAll");

app.UseAuthorization();
app.MapControllers();

app.Run();