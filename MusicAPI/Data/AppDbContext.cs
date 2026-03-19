using Microsoft.EntityFrameworkCore;
using MusicAPI.Models;

namespace MusicAPI.Data
{
    // Đây là lõi trung tâm quản lý toàn bộ dữ liệu của bạn
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Khai báo 2 bảng trong cơ sở dữ liệu
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<SavedSong> SavedSongs { get; set; }
    }
}
