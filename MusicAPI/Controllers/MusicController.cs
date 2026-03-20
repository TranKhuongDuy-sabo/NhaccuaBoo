using Microsoft.AspNetCore.Mvc;
using YoutubeExplode;
using YoutubeExplode.Common;
using YoutubeExplode.Videos.Streams;

namespace MusicAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MusicController : ControllerBase
    {
        private readonly YoutubeClient _youtube;

        public MusicController()
        {
            _youtube = new YoutubeClient();
        }

        // 1. API Tìm kiếm
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            try
            {
                var searchResults = await _youtube.Search.GetVideosAsync(query).CollectAsync(30);
                
                var result = searchResults.Select(v => new
                {
                    Id = v.Id.Value,
                    Title = v.Title,
                    Author = v.Author.ChannelTitle,
                    // FIX LỖI THỜI GIAN: Trên 1 tiếng thì hiện hh:mm:ss, dưới 1 tiếng thì mm:ss
                    Duration = v.Duration.HasValue 
                        ? (v.Duration.Value.TotalHours >= 1 ? v.Duration.Value.ToString(@"h\:mm\:ss") : v.Duration.Value.ToString(@"m\:ss")) 
                        : "Live",
                    Thumbnail = v.Thumbnails.GetWithHighestResolution().Url
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. API Lấy link Stream (Đã nâng cấp thành Proxy phát nhạc trực tiếp)
        [HttpGet("stream")]
        public async Task<IActionResult> GetStream([FromQuery] string videoId)
        {
            try
            {
                var streamManifest = await _youtube.Videos.Streams.GetManifestAsync(videoId);
                
                var streamInfo = streamManifest.GetAudioOnlyStreams()
                    .Where(s => s.Container == Container.Mp4)
                    .GetWithHighestBitrate();

                if (streamInfo == null)
                    return NotFound(new { message = "Không tìm thấy luồng âm thanh." });

                return Redirect(streamInfo.Url);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        // 3. API Đề xuất
        [HttpGet("related")]
        public async Task<IActionResult> GetRelated([FromQuery] string artist, [FromQuery] string currentVideoId)
        {
            try
            {
                var searchResults = await _youtube.Search.GetVideosAsync(artist + " mix").CollectAsync(10);
                
                var result = searchResults
                    .Where(v => v.Id.Value != currentVideoId)
                    .Select(v => new
                    {
                        Id = v.Id.Value,
                        Title = v.Title,
                        Author = v.Author.ChannelTitle,
                        // FIX LỖI THỜI GIAN
                        Duration = v.Duration.HasValue 
                            ? (v.Duration.Value.TotalHours >= 1 ? v.Duration.Value.ToString(@"h\:mm\:ss") : v.Duration.Value.ToString(@"m\:ss")) 
                            : "Live",
                        Thumbnail = v.Thumbnails.GetWithHighestResolution().Url
                    }).Take(5);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}