<template>
  <el-form ref="form" class="form" label-position="top">
    <a-alert style="margin-bottom: 20px;font-size: 14px;"  :description="$t('alerts.pluginDesc')" type="info" show-icon />
    <!-- selects 区域 -->

    <div>
      <span style="margin-right: 10px;">{{ $t("labels.table") }}</span>
      <a-select
        ref="select"
        v-model:value="tableId"
        style="width: 120px"
        @change="handleChange"     
      >
        <a-select-option v-for="(item, index) in tableMetaList" :value="item.value" :key="index">{{ item.label }}</a-select-option>
      
      </a-select>
    </div>

    
      

    



    
    <!-- Table 区域 -->
    <a-button class="editable-add-btn" style="margin: 16px 0 8px 0" @click="handleAdd">{{ $t("tables.add") }}</a-button>
    <a-table :columns="columns" :data-source="dataSource" bordered>
      <template #bodyCell="{ column, text, record }">
        <template v-if="['fieldName'].includes(column.dataIndex)">
          <div>
            <a-input
              v-if="editableData[record.key]"
              v-model:value="editableData[record.key][column.dataIndex]"
              style="margin: -5px 0"
            />
            <template v-else>
              {{ text }}
            </template>
          </div>
        </template>
        <template v-if="['fieldType'].includes(column.dataIndex)">
          <div>
            <a-select
              v-if="editableData[record.key]"
              v-model:value="editableData[record.key]['fieldType']"
              style="margin: -5px 0; width: 100%;"
              
            >
              <a-select-option
                v-for="option in fieldTypeOptions"
                :value="option.value"
                :key="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
            <template v-else>
              <a-tag :color="getFieldTypeTagColor(text)">{{ text }}</a-tag>
            </template>
          </div>
        </template>
        <template v-else-if="column.dataIndex === 'operation'">
          <div class="editable-row-operations">
            <span v-if="editableData[record.key]">
              <a-typography-link @click="save(record.key)"><CheckOutlined /></a-typography-link>
              <a-popconfirm :title="$t('tables.cancelConfirm')" @confirm="cancel(record.key)">
                <a style="margin-left: 20px;"><CloseOutlined :style="{color: '#ff2e51'}" /></a>
              </a-popconfirm>
            </span>
            <span v-else style="margin-right: 20px">
              <a @click="edit(record.key)"><EditOutlined /></a>
            </span>

            <a-popconfirm
              v-if="dataSource.length && !editableData[record.key]"
              :title="$t('tables.deleteConfirm')"
              @confirm="onDelete(record.key)"
            >
              <a><DeleteOutlined :style="{color: '#ff002b'}" /></a>
            </a-popconfirm>

          </div>
        </template>
      </template>
    </a-table>

    <a-button type="primary" @click="handleBatchAddField" size="large">{{ $t('submit') }}</a-button>
  </el-form>
</template>

<script setup>
import { bitable, FieldType, ToastType } from '@lark-base-open/js-sdk';
import { useI18n } from 'vue-i18n';
import { onMounted, computed, reactive, ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { EditOutlined, DeleteOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons-vue';

const { t } = useI18n();
const currentTable = ref({})
const tableMetaList = ref([]);
const fieldMetaList = ref([])
const tableId = ref("")
const viewId = ref("")



const fieldTypeOptions = ref([]);






// -- 数据区域


const columns = ref([])

const getFieldTypeTagColor = (fieldType) => {
  const option = fieldTypeOptions.value.find(option => option.value === fieldType);
  console.log(option)
  return option ? option.tagColor : '#ccc'; // 如果找不到对应项，默认返回灰色
};


const dataSource = ref([]);
const count = computed(() => dataSource.value.length + 1);
const editableData = reactive({});
const edit = key => {
  editableData[key] = cloneDeep(dataSource.value.filter(item => key === item.key)[0]);
  console.log("edit", key, editableData[key])
};
const save = key => {
  Object.assign(dataSource.value.filter(item => key === item.key)[0], editableData[key]);
  delete editableData[key];
};
const cancel = key => {
  delete editableData[key];
};

const onDelete = key => {
  dataSource.value = dataSource.value.filter(item => item.key !== key);
};
const handleAdd = () => {
  const newData = {
    key: `${count.value}`,
    fieldName: `${t('tables.newField')} ${count.value}`,
    fieldType: 'Text'
  };
  dataSource.value.push(newData);
};


const handleChange = (value) => {
  console.log(`selected ${value}`);
};


// -- 算法区域

/**
 * @{query} 转换metaList为select所需要的数据格式，并返回新的格式
 * @param {array} metaList 要处理的metaList
 */
const transferMetaListDataTypeToSelctCompentType = (metaList) => {
  const transferedData = []

  metaList.forEach(item => {
    transferedData.push({
      "value": item.id,
      "label": item.name
    }) 
  });

  return transferedData
}

const handleBatchAddField = async () => {
  const fieldListToCreate = dataSource.value

  // 创建字段
  try {
    await createFields(fieldListToCreate, tableId.value) 

  } catch (error) {
    await bitable.ui.showToast({
      toastType: ToastType.error,
      message: error.msg
    })

    return
  }

  
  await bitable.ui.showToast({
    toastType: ToastType.success,
    message: '处理完毕'
  })
  

  // 结束
}

const createFields = async (fieldListToCreate, tableId) => {
  const table = await bitable.base.getTableById(tableId)
  console.log("fieldListToCreate", fieldListToCreate)

  for (let fieldToCreate of fieldListToCreate) {
    
      await table.addField({
        type: FieldType[fieldToCreate.fieldType], // 或者使用动态值 
        name: fieldToCreate.fieldName,
      });
    
      
      // 可能需要进一步的错误处理逻辑
    
  
  }

}


onMounted(async () => {
  // 获取字段列表 -- start
  const selection = await bitable.base.getSelection()
  tableId.value = selection.tableId
  viewId.value = selection.viewId
  const table = await bitable.base.getTableById(selection.tableId)
  currentTable.value = table
  const view = await table.getViewById(selection.viewId)

  // getTableMetaList,用于选择特定数据表
  const fetchedTableMetaList = await bitable.base.getTableMetaList();
  tableMetaList.value = transferMetaListDataTypeToSelctCompentType(fetchedTableMetaList);

  

  // getFieldMetaList,用于表格展示
  fieldMetaList.value = await view.getFieldMetaList()
  console.log(fieldMetaList.value)

  dataSource.value = [{
    "key": '0',
    "fieldName": `${t('tables.newField')} 1`,
    "fieldType": "Text"
  }]

  columns.value = [
    {
      title: t('tables.fieldName'),
      dataIndex: 'fieldName',
      width: "40%"
    },
    {
      title: t('tables.fieldType'),
      dataIndex: 'fieldType',
      width: "30%"

    },
    {
      title: t('tables.operations'),
      dataIndex: 'operation',
      width: "30%"
    },
  ];

  fieldTypeOptions.value = [
    { value: 'Text', label: t('fieldTypeLabels.Text'), tagColor: '#f50' },
    { value: 'Number', label: t('fieldTypeLabels.Number'), tagColor: '#2db7f5' },
    { value: 'SingleSelect', label: t('fieldTypeLabels.SingleSelect'), tagColor: '#87d068' },
    { value: 'MultiSelect', label: t('fieldTypeLabels.MultiSelect'), tagColor: '#108ee9' },
    { value: 'DateTime', label: t('fieldTypeLabels.DateTime'), tagColor: '#6a5acd' },
    { value: 'Checkbox', label: t('fieldTypeLabels.Checkbox'), tagColor: '#fa8c16' },
    { value: 'User', label: t('fieldTypeLabels.User'), tagColor: '#ff69b4' },
    { value: 'Phone', label: t('fieldTypeLabels.Phone'), tagColor: '#00ced1' },
    { value: 'Url', label: t('fieldTypeLabels.Url'), tagColor: '#6495ed' },
    { value: 'Attachment', label: t('fieldTypeLabels.Attachment'), tagColor: '#ff6347' },
    { value: 'SingleLink', label: t('fieldTypeLabels.SingleLink'), tagColor: '#7cfc00' },
    { value: 'Lookup', label: t('fieldTypeLabels.Lookup'), tagColor: '#ffa07a' },
    { value: 'Formula', label: t('fieldTypeLabels.Formula'), tagColor: '#ff4500' },
    { value: 'DuplexLink', label: t('fieldTypeLabels.DuplexLink'), tagColor: '#1e90ff' },
    { value: 'Location', label: t('fieldTypeLabels.Location'), tagColor: '#32cd32' },
    { value: 'GroupChat', label: t('fieldTypeLabels.GroupChat'), tagColor: '#9400d3' },
    { value: 'CreatedTime', label: t('fieldTypeLabels.CreatedTime'), tagColor: '#708090' },
    { value: 'ModifiedTime', label: t('fieldTypeLabels.ModifiedTime'), tagColor: '#708090' },
    { value: 'CreatedUser', label: t('fieldTypeLabels.CreatedUser'), tagColor: '#20b2aa' },
    { value: 'ModifiedUser', label: t('fieldTypeLabels.ModifiedUser'), tagColor: '#20b2aa' },
    { value: 'AutoNumber', label: t('fieldTypeLabels.AutoNumber'), tagColor: '#ff8c00' },
    { value: 'Barcode', label: t('fieldTypeLabels.Barcode'), tagColor: '#a52a2a' },
    { value: 'Progress', label: t('fieldTypeLabels.Progress'), tagColor: '#8fbc8f' },
    { value: 'Currency', label: t('fieldTypeLabels.Currency'), tagColor: '#db7093' },
    { value: 'Rating', label: t('fieldTypeLabels.Rating'), tagColor: '#4682b4' },
    { value: 'Email', label: t('fieldTypeLabels.Email'), tagColor: '#da70d6' },
  ]
  
});
    
</script>



<style lang="less" scoped>
.editable-cell {
  position: relative;
  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 24px;
  }

  .editable-cell-text-wrapper {
    padding: 5px 24px 5px 5px;
  }

  .editable-cell-icon,
  .editable-cell-icon-check {
    position: absolute;
    right: 0;
    width: 20px;
    cursor: pointer;
  }

  .editable-cell-icon {
    margin-top: 4px;
    display: none;
  }

  .editable-cell-icon-check {
    line-height: 28px;
  }

  .editable-cell-icon:hover,
  .editable-cell-icon-check:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}
.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}
</style>