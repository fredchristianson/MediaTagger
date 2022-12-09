using MediaTagger.Modules.FileSystem;
using MediaTagger.Modules.MediaItem;
using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediaTagger.Modules.MediaFile
{
    public class MediaFileModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MediaFileId { get; set; }

        public string Name { get; set; } = string.Empty;

        public DateTime Modified { get; set; } = DateTime.UtcNow;
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime? DateTaken { get; set; } = DateTime.UtcNow;

        public virtual MediaItemModel? MediaItem { get; set; }
        public int? MediaItemId { get; set; }

        public virtual PathModel? Path { get; set; }
        public int? PathId { get; set; }

        public long FileSize { get; set; }

        public string? ExifJson { get; set; }

    }
}
