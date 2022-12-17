using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Modules.MediaFile;

namespace MediaTagger.Modules.Album
{
    public class AlbumFileModel
    {
        public long AlbumId { get; set; }
        public AlbumModel Album { get; set; } = null!;

        public long MediaFileId { get; set; }
        public MediaFileModel MediaFile { get; set; } = null!;
    }
}
