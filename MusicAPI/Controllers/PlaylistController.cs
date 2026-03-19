using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicAPI.Data;
using MusicAPI.Models;

namespace MusicAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlaylistController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Cắm Database vào Controller
        public PlaylistController(AppDbContext context)
        {
            _context = context;
        }

        // 1. API Lấy toàn bộ Danh sách phát (kèm theo bài hát bên trong)
        [HttpGet]
        public async Task<IActionResult> GetPlaylists()
        {
            var playlists = await _context.Playlists
                .Include(p => p.Songs) // Lấy luôn các bài hát con bên trong
                .ToListAsync();
            return Ok(playlists);
        }

        // 2. API Tạo một Playlist mới
        [HttpPost]
        public async Task<IActionResult> CreatePlaylist([FromBody] Playlist playlist)
        {
            if (string.IsNullOrWhiteSpace(playlist.Name))
                return BadRequest("Tên danh sách không được để trống.");

            _context.Playlists.Add(playlist);
            await _context.SaveChangesAsync();
            return Ok(playlist); // Trả về list vừa tạo
        }

        // 3. API Thêm 1 bài hát vào Playlist
        [HttpPost("{playlistId}/songs")]
        public async Task<IActionResult> AddSongToPlaylist(int playlistId, [FromBody] SavedSong song)
        {
            var playlist = await _context.Playlists.FindAsync(playlistId);
            if (playlist == null) return NotFound("Không tìm thấy Playlist.");

            song.PlaylistId = playlistId; // Gắn bài hát này vào đúng ID của List
            _context.SavedSongs.Add(song);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Đã lưu bài hát thành công!" });
        }

        // 4. API Xóa Playlist (Xóa vỏ lẫn ruột)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlaylist(int id)
        {
            // Thêm Include để lấy và xóa luôn các bài hát bên trong
            var playlist = await _context.Playlists
                .Include(p => p.Songs) 
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (playlist == null) return NotFound("Không tìm thấy Playlist.");

            _context.Playlists.Remove(playlist);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa Playlist" });
        }

        // 5. API Xóa một bài hát cụ thể khỏi Playlist
        [HttpDelete("song/{songId}")]
        public async Task<IActionResult> DeleteSong(int songId)
        {
            var song = await _context.SavedSongs.FindAsync(songId);
            if (song == null) return NotFound("Không tìm thấy bài hát.");

            _context.SavedSongs.Remove(song);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bài hát" });
        }
    }
}