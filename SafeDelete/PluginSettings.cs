using MediaBrowser.Model.Plugins;
using System;
using System.Collections.Generic;
using System.Text;

namespace SafeDelete
{
    public class PluginSettings : BasePluginConfiguration
    {
        public string RecycledPath { set; get; }
    }
}
