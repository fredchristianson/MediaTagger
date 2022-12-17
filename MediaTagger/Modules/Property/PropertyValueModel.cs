using System.ComponentModel.DataAnnotations.Schema;
using MediaTagger.Modules.MediaFile;

namespace MediaTagger.Modules.Property
{
    public class PropertyValueModel : MediaEntity
    {
        public PropertyValueModel()
        { }

        public long? PropertyId { get; set; } = null!;


        virtual public ICollection<MediaFileModel> MediaFiles { get; set; } = null!;
    }


}



