import { defineComponent, reactive, toRefs } from "vue";
import { Form } from "ant-design-vue";

export default defineComponent({
  emits: ["confirm"],
  setup(_props, { emit }) {
    const useForm = Form.useForm;

    const state = reactive({
      visible: false,
      formState: {
        name: null,
      },
    });

    const methods = {
      open() {
        resetFields();
        state.visible = true;
      },
      async onConfirm() {
        await validate();
        const tabsData = localStorage.getItem("tabs-data")
          ? JSON.parse(localStorage.getItem("tabs-data")!)
          : [];
        tabsData.push({
          title: state.formState.name,
          data: [],
        });

        localStorage.setItem("tabs-data", JSON.stringify(tabsData));
        state.visible = false;
        emit("confirm");
      },
    };

    const rules = {
      name: [
        {
          required: true,
          message: "标签名称不能为空",
        },
      ],
    };

    const { resetFields, validateInfos, validate } = useForm(
      state.formState,
      rules
    );

    return {
      validateInfos,
      ...toRefs(state),
      ...methods,
    };
  },
});
