namespace MusicAPI.Models
{
    public class Playlist
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Tên list nhạc (VD: Nhạc quẩy cuối tuần)
        
        // Mối quan hệ: 1 Playlist sẽ chứa nhiều bài hát (SavedSong)
        public List<SavedSong> Songs { get; set; } = new();
    }
}