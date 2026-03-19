namespace MusicAPI.Models
{
    public class SavedSong
    {
        public int Id { get; set; }
        public string VideoId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Thumbnail { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;

        // Cho biết bài hát này thuộc về Playlist nào
        public int PlaylistId { get; set; }
    }
}