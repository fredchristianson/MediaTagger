using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Modules.MediaFile;

namespace MediaTagger.Modules.Tag
{
    public class TagModel : MediaEntity
    {
        public TagModel()
        {

        }
        public TagModel? Parent { get; set; } = null;

        //public long? ParentId { get; set; } = null;


        virtual public ICollection<TagModel> Children { get; set; } = null!;
        virtual public ICollection<MediaFileModel> MediaFiles { get; set; } = null!;
    }


}
