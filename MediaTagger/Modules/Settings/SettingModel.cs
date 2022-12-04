using SqlExpress;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediaTagger.Modules.Setting
{
    public class SettingModel
    {
        [Key]
        [Column(Order = 1)]
        public string Scope { get; set; } = string.Empty;

        [Key]
        [Column(Order = 2)]
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
