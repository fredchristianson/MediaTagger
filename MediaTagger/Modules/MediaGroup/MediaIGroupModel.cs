using MediaTagger.Modules.MediaFile;
using MediaTagger.Modules.MediaItem;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediaTagger.Modules.MediaGroup
{
    public class MediaGroupModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MediaGroupId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public DateTime Modified { get; set; } = DateTime.UtcNow;
        public DateTime Created { get; set; } = DateTime.UtcNow;


        public virtual ICollection<MediaItemModel>? MediaItems { get; set; }
    }
}
