import { defineComponent, reactive, toRefs } from "vue";
import { Form } from "ant-design-vue";
import { generateHash } from "@/utils/utils";

export default defineComponent({
  emits: ["confirm"],
  setup(_props, { emit }) {
    const useForm = Form.useForm;

    const state = reactive({
      visible: false,
      formState: {
        name: "",
        path: "",
        iconPath: "",
        tab: null,
        size: "",
        icon: "",
      },
      tabsOptions: null,
    });

    const methods = {
      open() {
        resetFields();
        state.visible = true;
        const tabsData = localStorage.getItem("tabs-data")
          ? JSON.parse(localStorage.getItem("tabs-data")!)
          : [];
        state.tabsOptions = tabsData.map((item: any) => {
          return {
            value: item.title,
            label: item.title,
          };
        });
      },
      async selectExe() {
        try {
          const result = await window.ipcRenderer.selectExe();
          if (result?.filePath) {
            const hash = await generateHash(result.filePath);
            const iconFileName = `${hash}.ico`;
            
            try {
              // 提取图标并获取 base64 数据
              const base64Icon = await window.ipcRenderer.extractIcon(
                result.filePath,
                iconFileName
              );
              
              state.formState.path = result.filePath;
              state.formState.size = result.size;
              state.formState.icon = base64Icon;  // 直接使用 base64 数据
              
              // 如果用户还没有输入名称，自动使用文件名
              if (!state.formState.name) {
                state.formState.name = result.fileName;
              }
            } catch (err) {
              console.error("提取图标失败:", err);
              // 使用默认图标
              state.formState.icon = './exe.png';
            }
          }
        } catch (error) {
          console.error("选择应用程序失败:", error);
        }
      },
      async selectIcon() {
        try {
          const result = await window.ipcRenderer.selectIcon();
          if (result?.filePath) {
            state.formState.iconPath = result.filePath;
            state.formState.icon = result.icon;
          }
        } catch (error) {
          console.error("选择图标失败:", error);
        }
      },
      async onConfirm() {
        try {
          await validate();
          const copyData = {
            ...JSON.parse(JSON.stringify(state.formState)),
            icon: state.formState.icon || "./exe.png",
          };

          emit("confirm", copyData);
          state.visible = false;
        } catch (error) {
          // 校验失败时不关闭弹窗
          console.error("表单校验失败:", error);
        }
      },
    };

    const rules = {
      name: [
        {
          required: true,
          message: "应用名称不能为空",
        },
      ],
      path: [
        {
          required: true,
          message: "请选择应用程序",
          validator: (_rule: any, value: string) => {
            if (!value) {
              return Promise.reject("请选择应用程序");
            }
            // 检查文件是否存在且是否为 .exe 文件
            if (!value.toLowerCase().endsWith(".exe")) {
              return Promise.reject("请选择有效的应用程序(.exe)文件");
            }
            return Promise.resolve();
          },
        },
      ],
      tab: [
        {
          required: true,
          message: "分类标签不能为空",
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
