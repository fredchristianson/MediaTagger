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

    public MediaItemModel? MediaItem { get; set; }
    public int MediaItemForeignKey { get; set; }

  }
}
