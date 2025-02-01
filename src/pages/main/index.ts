import { defineComponent, reactive, ref, toRefs } from "vue";
import ModalAddApplicationComp from "./comps/modal-add-application/index.vue";
import ModalAddTabComp from "./comps/modal-add-tab/index.vue";
import { Empty, message, Modal } from "ant-design-vue";

export default defineComponent({
  components: {
    ModalAddApplicationComp,
    ModalAddTabComp,
  },
  setup() {
    const state = reactive({
      listData: localStorage.getItem("tabs-data")
        ? JSON.parse(localStorage.getItem("tabs-data")!)
        : [],
      simpleImage: Empty.PRESENTED_IMAGE_SIMPLE,
    });

    const components = {
      modalAddApplicationRef: ref<InstanceType<
        typeof ModalAddApplicationComp
      > | null>(null),
      modalAddTabRef: ref<InstanceType<typeof ModalAddTabComp> | null>(null),
    };

    const methods = {
      onOpen(path: string) {
        window.ipcRenderer.executeExe(path);
      },
      // 打开增加分类标签的弹框
      onShowAddTab() {
        components.modalAddTabRef.value!.open();
      },
      onConfirmTab() {
        state.listData = localStorage.getItem("tabs-data")
          ? JSON.parse(localStorage.getItem("tabs-data")!)
          : [];
      },
      // 打开弹框(添加应用)
      onShow() {
        components.modalAddApplicationRef.value!.open();
      },
      // 编辑应用
      onEdit(index: number, item: any) {
        components.modalAddApplicationRef.value?.open(true, item, index);
      },
      // 修改确认保存方法
      onConfirm(data: any, isEdit: boolean, editIndex: number) {
        // 检查是否存在相同路径的应用
        const isDuplicate = state.listData.some((tab: any) => 
          tab.data.some((app: any) => 
            app.path === data.path && (!isEdit || app !== tab.data[editIndex])
          )
        );

        if (!isEdit && isDuplicate) {
          message.error('该应用已存在，不能重复添加');
          return;
        }

        if (isEdit) {
          // 编辑模式
          // 1. 找到包含当前应用的分类和应用索引
          let currentTabIndex = -1;
          let appIndex = -1;
          
          state.listData.forEach((tab: any, tIndex: number) => {
            const aIndex = tab.data.findIndex((app: any) => app.path === data.path);
            if (aIndex !== -1) {
              currentTabIndex = tIndex;
              appIndex = aIndex;
            }
          });

          if (currentTabIndex !== -1 && appIndex !== -1) {
            const currentTab = state.listData[currentTabIndex];
            
            if (currentTab.title === data.tab) {
              // 如果分类没有改变，直接更新数据
              currentTab.data[appIndex] = data;
            } else {
              // 如果分类改变了
              // 1. 从旧分类中删除
              currentTab.data.splice(appIndex, 1);
              
              // 2. 添加到新分类
              const newTab = state.listData.find((item: any) => item.title === data.tab);
              if (newTab) {
                newTab.data.push(data);
              }
            }
          }
        } else {
          // 添加模式
          state.listData.forEach((item: any) => {
            if (item.title === data.tab) {
              item.data.push(data);
            }
          });
        }
        
        // 保存到 localStorage
        localStorage.setItem("tabs-data", JSON.stringify(state.listData));
        message.success(isEdit ? '编辑成功' : '添加成功');
      },
      // 导出配置
      async exportData() {
        try {
          const data = localStorage.getItem("tabs-data");
          if (!data) {
            message.warning("暂无数据可导出");
            return;
          }
          await window.ipcRenderer.exportConfig(data);
          message.success("导出成功");
        } catch (error) {
          console.error("导出失败:", error);
          message.error("导出失败");
        }
      },
      // 导入配置
      async importData() {
        try {
          const result = await window.ipcRenderer.importConfig();
          if (result) {
            state.listData = JSON.parse(result);
            localStorage.setItem("tabs-data", result);
            message.success("导入成功");
          }
        } catch (error) {
          console.error("导入失败:", error);
          message.error("导入失败");
        }
      },
      // 清除配置
      clearData() {
        localStorage.removeItem("tabs-data");
        state.listData = localStorage.getItem("tabs-data")
          ? JSON.parse(localStorage.getItem("tabs-data")!)
          : [];
      },
      // 删除应用
      onDelete(tabTitle: string, index: number) {
        Modal.confirm({
          title: "确认删除",
          content: "确定要删除这个应用吗？",
          okText: "确定",
          cancelText: "取消",
          onOk() {
            // 找到对应的标签页
            const tab = state.listData.find(
              (item: any) => item.title === tabTitle
            );
            if (tab) {
              // 从数组中删除应用
              tab.data.splice(index, 1);
              // 更新本地存储
              localStorage.setItem("tabs-data", JSON.stringify(state.listData));
              message.success("删除成功");
            }
          },
        });
      },
    };
    return {
      ...toRefs(state),
      ...methods,
      ...components,
    };
  },
});
