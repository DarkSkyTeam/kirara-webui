<script setup lang="ts">
import { watch, h } from 'vue'
import { NFormItem, NInput, NInputNumber, NSwitch, NSelect, NTooltip, NText, NButton, NIcon } from 'naive-ui'
import type { PropType } from 'vue'
import { CloseOutline, AddOutline } from '@vicons/ionicons5'
import { useMessage } from 'naive-ui'

const $message = useMessage()

interface SchemaProperty {
    title: string
    type?: string
    description?: string
    default?: any
    hidden_unset?: boolean
    textType?: boolean
    minimum?: number
    maximum?: number
    enum?: any[]
    enumNames?: string[]
    items?: {
        type: string
        enum?: any[]
        enumNames?: string[]
        minimum?: number
        maximum?: number
        default?: any
    }
    $ref?: string
    anyOf?: Array<{
        type: string
        enum?: any[]
        enumNames?: string[]
    }>
    examples?: any[]
    readOnly?: boolean
}

interface Schema {
    title: string
    type: string
    properties: Record<string, SchemaProperty>
    required?: string[]
    $defs?: Record<string, SchemaProperty>
}

const props = defineProps({
    schema: {
        type: Object as PropType<Schema>,
        required: true
    },
    modelValue: {
        type: Object as PropType<Record<string, any>>,
        required: true
    }
})

const validateForm = () => {
    const requiredFields = props.schema.required || []
    for (const key in props.schema.properties) {
        const property = props.schema.properties[key];
        if (requiredFields.includes(key) && !props.modelValue[key]) {
            $message.error(`${property.title} 是必填项`);
            return false;
        }
    }
    return true;
}

const updateValue = (key: string, value: any) => {
    emit('update:modelValue', {
        ...props.modelValue,
        [key]: value
    });
}
const emit = defineEmits(['update:modelValue'])

const resolveProperty = (property: SchemaProperty, key: string): SchemaProperty => {
    if (property.anyOf) {
        const nonNullType = property.anyOf.find(type => type.type !== 'null')
        if (nonNullType) {
            property = {
                ...property,
                type: nonNullType.type,
                enum: nonNullType.enum,
                enumNames: nonNullType.enumNames
            }
        }
    }

    if (property.$ref && !property.type) {
        const refPath = property.$ref.split('/')
        if (refPath[0] === '#' && refPath[1] === '$defs') {
            const defName = refPath[2]
            const refProperty = props.schema.$defs?.[defName]
            if (refProperty) {
                property = { ...property, ...refProperty }
            }
        }
    }

    return property
}

const renderInputComponent = (itemType: string, property: SchemaProperty, itemValue: any, updateItemValue: (val: any) => void) => {
    const commonProps = {
        value: itemValue,
        placeholder: property.examples?.[0] || (property.default !== undefined && property.default !== null) ? String(property.default) : '',
        onUpdateValue: updateItemValue,
        disabled: property.readOnly === true
    }

    switch (itemType) {
        case 'string':
            if (property.enum) {
                return h(NSelect, {
                    ...commonProps,
                    options: property.enum?.map((value, index) => ({
                        label: property.enumNames?.[index] || value,
                        value
                    }))
                })
            }
            return h(NInput, {
                ...commonProps,
                type: isSecretField(property.title) ? 'password' : 'text',
                showPasswordOn: 'click',
            })
        case 'number':
        case 'integer':
            return h(NInputNumber, {
                ...commonProps,
                min: property.minimum,
                max: property.maximum,
            })
        case 'boolean':
            return h(NSwitch, commonProps)
        default:
            return h(NText, { content: `不支持的类型: ${itemType}` })
    }
}

const isSecretField = (title: string): boolean => {
    const lowerTitle = title.toLowerCase()
    return ['password', 'token', 'secret', 'key'].some(keyword => lowerTitle.includes(keyword))
}

const renderArrayField = (key: string, property: SchemaProperty, formItemProps: any) => {
    const itemType = property.items?.type
    if (!itemType) return null

    let arrayValue = props.modelValue[key] as any[] || []

    const renderArrayItem = (index: number) => {
        const itemValue = arrayValue[index]
        const removeItem = () => {
            arrayValue.splice(index, 1)
            updateValue(key, arrayValue.length > 0 ? arrayValue : undefined)
        }

        const updateItemValue = (val: any) => {
            arrayValue[index] = val
            updateValue(key, arrayValue)
        }

        const itemProperty: SchemaProperty = {
            title: `${property.title}[${index}]`,
            type: itemType,
            minimum: property.items?.minimum,
            maximum: property.items?.maximum,
            default: property.items?.default,
            enum: property.items?.enum,
            enumNames: property.items?.enumNames
        }

        return h('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px',
                gap: '8px'
            }
        }, [
            h('span', { style: { minWidth: '32px', color: 'var(--n-text-color-3)' } }, `[${index + 1}]`),
            h('div', { style: { flex: 1 } }, [renderInputComponent(itemType, itemProperty, itemValue, updateItemValue)]),
            h(NButton, {
                type: 'error',
                size: 'tiny',
                quaternary: true,
                onClick: removeItem,
            }, {
                default: () => h(NIcon, null, { default: () => h(CloseOutline) })
            })
        ])
    }

    const addArrayItem = () => {
        const defaultValue = property.items?.default !== undefined ? property.items.default : null
        arrayValue.push(defaultValue)
        updateValue(key, arrayValue)
    }

    return h(NFormItem, formItemProps, {
        default: () => h('div', { style: { padding: '8px 0' } }, [
            ...(arrayValue.length > 0
                ? arrayValue.map((_, index) => renderArrayItem(index))
                : [h('div', {
                    style: {
                        color: 'var(--n-text-color-3)',
                        fontStyle: 'italic',
                        padding: '4px 0'
                    }
                }, '暂无数据')]),
            h(NButton, {
                type: 'primary',
                size: 'small',
                dashed: true,
                style: { width: '100%', marginTop: '8px' },
                onClick: addArrayItem
            }, {
                default: () => [
                    h(NIcon, null, { default: () => h(AddOutline) }),
                    ' 添加'
                ]
            })
        ])
    })
}

const renderWebhookUrlText = (key: string, value: string) => {
    return h(NText, value)
}

const renderField = (key: string, property: SchemaProperty) => {
    let value = props.modelValue[key]

    if (property.hidden_unset && (value === undefined || value === null || value === '')) {
        return null
    }

    if (value === undefined && property.default) {
        value = property.default
        updateValue(key, value)
    }

    const required = props.schema.required?.includes(key)
    const formItemProps = {
        label: property.title,
        required: required,
        feedback: property.description || ''
    }

    property = resolveProperty(property, key)

    if (property.type === 'array' && property.items) {
        return renderArrayField(key, property, formItemProps)
    }

    if (property.textType) {
        return h(NFormItem, formItemProps, {
            default: () => renderWebhookUrlText(key, value || property.examples?.[0] || property.default || null)
        })
    } else {
        return h(NFormItem, formItemProps, {
            default: () => renderInputComponent(
                property.type || 'string',
                property,
                value || property.examples?.[0] || property.default || null,
                (val) => updateValue(key, val)
            )
        })
    }
}

defineExpose({
    validateForm
})
</script>

<template>
    <div class="dynamic-config-form">
        <template v-for="(property, key) in schema.properties" :key="key">
            <component :is="renderField(key, property)" />
        </template>
        <p v-if="Object.keys(schema.properties).length === 0">暂无配置，请关闭本窗口</p>
    </div>
</template>

<style scoped>
.dynamic-config-form {
    width: 100%;
}
</style>