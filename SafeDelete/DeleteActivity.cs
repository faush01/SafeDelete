using System;
using System.Collections.Generic;
using System.Text;

namespace SafeDelete
{
    public sealed class DeleteActivity
    {
        private static readonly DeleteActivity instance = new DeleteActivity();
        private List<DeleteAction> delete_actions = new List<DeleteAction>();

        static DeleteActivity()
        {
        }

        private DeleteActivity()
        {
        }

        public static DeleteActivity Instance
        {
            get
            {
                return instance;
            }
        }

        public List<DeleteAction> GetActions()
        {
            return delete_actions;
        }
    }
}
