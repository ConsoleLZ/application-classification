import { defineComponent, ref } from 'vue';
import draggable from 'vuedraggable';
import { HolderOutlined } from '@ant-design/icons-vue';

export default defineComponent({
  components: {
    draggable,
    HolderOutlined
  },
  emits: ['confirm'],
  setup(_props, { emit }) {
    const visible = ref(false);
    const localTabs = ref([]);

    const open = (tabs: any[]) => {
      localTabs.value = JSON.parse(JSON.stringify(tabs));
      visible.value = true;
    };

    const onConfirm = () => {
      emit('confirm', localTabs.value);
      visible.value = false;
    };

    return {
      visible,
      localTabs,
      open,
      onConfirm
    };
  }
}); 